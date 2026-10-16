// MaduraNyam - fungsi bersama untuk halaman setelah login (dashboard, menu, keranjang, dst.).
const MN = (function () {
  "use strict";

  let uidAktif = null;
  let namaAktif = "";
  let berlangganan = null;

  const authAktif = () =>
    (typeof firebase !== "undefined" && firebase.apps.length && typeof firebase.auth === "function") ? firebase.auth() : null;
  const basis = () => (typeof db !== "undefined" && db) ? db : null;
  const refKeranjang = () => (basis() && uidAktif) ? basis().collection("keranjang").doc(uidAktif) : null;
  const idMenu = (m) => m.id || m.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const el = (tag, kelas, teks) => {
    const n = document.createElement(tag);
    if (kelas) n.className = kelas;
    if (teks) n.textContent = teks;
    return n;
  };
  const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");

  function toast(teks) {
    const t = el("div", "toast", teks);
    t.setAttribute("role", "status");
    document.body.append(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ---------- Keranjang (disimpan di database: koleksi "keranjang", satu dokumen per pengguna) ----------
  function galatKeranjang(e) {
    console.error("[MaduraNyam] Keranjang:", e);
    toast(e && e.code === "permission-denied"
      ? "Akses ditolak. Perbarui aturan Firestore untuk keranjang."
      : "Gagal memperbarui keranjang. Coba lagi.");
  }

  async function tambahKeKeranjang(m) {
    const ref = refKeranjang();
    if (!ref) return toast("Database belum terhubung.");
    const F = firebase.firestore.FieldValue;
    try {
      await ref.set({
        item: { [idMenu(m)]: { nama: m.nama, harga: m.harga, ikon: m.ikon || "🍽️", jumlah: F.increment(1) } },
        diperbarui: F.serverTimestamp()
      }, { merge: true });
      toast(m.nama + " masuk keranjang.");
    } catch (e) { galatKeranjang(e); }
  }

  async function ubahJumlah(it, delta) {
    const ref = refKeranjang();
    if (!ref) return;
    const F = firebase.firestore.FieldValue;
    const baru = it.jumlah + delta;
    if (baru > 99) return toast("Maksimal 99 untuk satu menu.");
    try {
      if (baru <= 0) await ref.update({ ["item." + it.id]: F.delete() });
      else await ref.update({ ["item." + it.id + ".jumlah"]: F.increment(delta) });
    } catch (e) { galatKeranjang(e); }
  }

  async function hapusItem(id) {
    const ref = refKeranjang();
    if (!ref) return;
    try { await ref.update({ ["item." + id]: firebase.firestore.FieldValue.delete() }); }
    catch (e) { galatKeranjang(e); }
  }

  async function kosongkan() {
    const ref = refKeranjang();
    if (!ref) return;
    try { await ref.set({ item: {}, diperbarui: firebase.firestore.FieldValue.serverTimestamp() }); }
    catch (e) { galatKeranjang(e); }
  }

  function setBadge(n) {
    const tombol = document.getElementById("nav-keranjang");
    if (!tombol) return;
    let b = tombol.querySelector(".badge");
    if (!b) { b = el("span", "badge"); b.setAttribute("aria-hidden", "true"); tombol.append(b); }
    b.hidden = n <= 0;
    b.textContent = n > 99 ? "99+" : String(n);
    tombol.setAttribute("aria-label", n > 0 ? "Keranjang, " + n + " item" : "Keranjang");
  }

  function pantauKeranjang(saatBerubah) {
    const ref = refKeranjang();
    if (!ref) return null;
    return ref.onSnapshot((snap) => {
      const data = snap.exists ? (snap.data().item || {}) : {};
      const items = Object.keys(data)
        .map((id) => Object.assign({ id }, data[id]))
        .filter((x) => x.jumlah > 0)
        .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
      setBadge(items.reduce((n, x) => n + x.jumlah, 0));
      if (saatBerubah) saatBerubah(items);
    }, (e) => { galatKeranjang(e); if (saatBerubah) saatBerubah([]); });
  }

  // ---------- Pesanan (koleksi "pesanan", satu dokumen per pesanan) ----------
  const koleksiPesanan = () => basis() ? basis().collection("pesanan") : null;
  const waktuMs = (p) => (p.dibuatPada && p.dibuatPada.toMillis) ? p.dibuatPada.toMillis() : 0;

  function galatPesanan(e) {
    console.error("[MaduraNyam] Pesanan:", e);
    toast(e && e.code === "permission-denied"
      ? "Akses ditolak. Perbarui aturan Firestore untuk pesanan."
      : "Gagal memproses pesanan. Coba lagi.");
  }

  // Simpan pesanan baru dan kosongkan keranjang dalam satu langkah (batch)
  async function buatPesanan(items, opsi) {
    const col = koleksiPesanan(), keranjang = refKeranjang();
    if (!col || !keranjang) { toast("Database belum terhubung."); return false; }
    if (!items.length) return false;
    const F = firebase.firestore.FieldValue;
    const batch = basis().batch();
    batch.set(col.doc(), {
      uid: uidAktif,
      pemesan: namaAktif,
      item: items.map((x) => ({ id: x.id, nama: x.nama, harga: x.harga, ikon: x.ikon, jumlah: x.jumlah })),
      jumlahItem: items.reduce((n, x) => n + x.jumlah, 0),
      total: items.reduce((n, x) => n + x.harga * x.jumlah, 0),
      metode: opsi.metode,
      catatan: opsi.catatan,
      status: "diproses",
      dibuatPada: F.serverTimestamp()
    });
    batch.set(keranjang, { item: {}, diperbarui: F.serverTimestamp() });
    try { await batch.commit(); return true; }
    catch (e) { galatPesanan(e); return false; }
  }

  // Pantau riwayat pesanan milik pengguna (urut terbaru di atas)
  function pantauPesanan(saatBerubah, semua) {
    const col = koleksiPesanan();
    if (!col || !uidAktif) return null;
    return (semua ? col : col.where("uid", "==", uidAktif)).onSnapshot((snap) => {
      const daftar = snap.docs
        .map((d) => Object.assign({ id: d.id }, d.data({ serverTimestamps: "estimate" })))
        .sort((a, b) => waktuMs(b) - waktuMs(a));
      saatBerubah(daftar);
    }, (e) => { galatPesanan(e); saatBerubah([]); });
  }

  async function batalkanPesanan(id) {
    const col = koleksiPesanan();
    if (!col) return;
    try {
      await col.doc(id).update({ status: "dibatalkan", diperbarui: firebase.firestore.FieldValue.serverTimestamp() });
      toast("Pesanan dibatalkan.");
    } catch (e) { galatPesanan(e); }
  }

  // ---------- Pesan lagi & admin ----------
  // Masukkan semua item pesanan lama ke keranjang
  async function pesanLagi(items) {
    const ref = refKeranjang();
    if (!ref) { toast("Database belum terhubung."); return false; }
    const F = firebase.firestore.FieldValue, item = {};
    items.forEach((x) => { item[x.id] = { nama: x.nama, harga: x.harga, ikon: x.ikon, jumlah: F.increment(x.jumlah) }; });
    try { await ref.set({ item, diperbarui: F.serverTimestamp() }, { merge: true }); return true; }
    catch (e) { galatKeranjang(e); return false; }
  }

  // Admin = pengguna yang punya dokumen di koleksi "admin" (id dokumen = UID, dibuat manual di Firebase Console)
  async function cekAdmin() {
    if (!basis() || !uidAktif) return false;
    try { return (await basis().collection("admin").doc(uidAktif).get()).exists; }
    catch (e) { return false; }
  }

  async function ubahStatus(id, status) {
    const col = koleksiPesanan();
    if (!col) return;
    try { await col.doc(id).update({ status, diperbarui: firebase.firestore.FieldValue.serverTimestamp() }); }
    catch (e) { galatPesanan(e); }
  }

  // ---------- Menu (koleksi "menu", satu dokumen per produk) ----------
  function galatMenu(e) {
    console.error("[MaduraNyam] Menu:", e);
    toast(e && e.code === "permission-denied"
      ? "Akses ditolak. Perbarui aturan Firestore untuk menu."
      : "Gagal memproses menu. Coba lagi.");
  }

  function pantauMenu(saatBerubah) {
    if (!basis()) return null;
    return basis().collection("menu").onSnapshot((snap) => {
      const daftar = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))
        .sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || (a.nama || "").localeCompare(b.nama || "", "id"));
      saatBerubah(daftar);
    }, (e) => { galatMenu(e); saatBerubah([]); });
  }

  // id kosong = produk baru; id terisi = ubah produk
  async function simpanProduk(id, data) {
    if (!basis()) { toast("Database belum terhubung."); return false; }
    const F = firebase.firestore.FieldValue, col = basis().collection("menu");
    try {
      if (id) await col.doc(id).update(Object.assign({}, data, { diperbarui: F.serverTimestamp() }));
      else await col.add(Object.assign({}, data, { urutan: Date.now(), dibuatPada: F.serverTimestamp() }));
      return true;
    } catch (e) { galatMenu(e); return false; }
  }

  async function hapusProduk(id) {
    if (!basis()) return false;
    try { await basis().collection("menu").doc(id).delete(); return true; }
    catch (e) { galatMenu(e); return false; }
  }

  // Isi menu awal dari data-menu.js (id dokumen sama dengan id lama di keranjang)
  async function isiMenuContoh() {
    if (!basis() || typeof MENU_CONTOH === "undefined") return false;
    const F = firebase.firestore.FieldValue, batch = basis().batch();
    MENU_CONTOH.forEach((m, i) => batch.set(basis().collection("menu").doc(idMenu(m)),
      Object.assign({}, m, { foto: "", urutan: i, dibuatPada: F.serverTimestamp() })));
    try { await batch.commit(); return true; } catch (e) { galatMenu(e); return false; }
  }

  // ---------- Halaman ----------
  // Gerbang login: hanya pengguna yang sudah masuk yang boleh melihat halaman
  function gerbang(saatMasuk, saatKeranjang) {
    const auth = authAktif();
    if (!auth) { location.replace("login.html"); return null; }
    auth.onAuthStateChanged((user) => {
      if (!user) { location.replace("login.html"); return; }
      uidAktif = user.uid;
      namaAktif = user.displayName || (user.email || "").split("@")[0] || "pengguna";
      saatMasuk(user);
      if (!berlangganan) berlangganan = pantauKeranjang(saatKeranjang);
      document.body.classList.remove("menunggu");
      const awal = document.getElementById("awal");
      if (awal) awal.remove();
    });
    return auth;
  }

  // Kartu menu
  function kartu(m, aksi) {
    const k = el("article", "kartu"), baris = el("div", "baris"), tambah = el("button", "tambah", "+");
    tambah.type = "button";
    tambah.setAttribute("aria-label", "Tambah " + m.nama + " ke keranjang");
    tambah.addEventListener("click", () => tambahKeKeranjang(m));
    const gambar = el("div", "gambar");
    if (m.foto) { const img = el("img"); img.src = m.foto; img.alt = ""; img.loading = "lazy"; gambar.append(img); }
    else gambar.textContent = m.ikon || "🍽️";
    gambar.setAttribute("aria-hidden", "true");
    baris.append(el("span", "harga", rupiah(m.harga)), tambah);
    k.append(gambar, el("h3", "", m.nama), el("p", "info", m.info), baris);
    if (aksi) {
      const w = el("div", "aksi-kartu"), ubah = el("button", "mini", "Ubah"), hapus = el("button", "mini bahaya", "Hapus");
      ubah.type = hapus.type = "button";
      ubah.setAttribute("aria-label", "Ubah " + m.nama); hapus.setAttribute("aria-label", "Hapus " + m.nama);
      ubah.addEventListener("click", () => aksi.ubah(m)); hapus.addEventListener("click", () => aksi.hapus(m));
      w.append(ubah, hapus); k.append(w);
    }
    return k;
  }

  // Chip kategori
  function chipKategori(wadah, daftar, saatPilih) {
    daftar.forEach((nama, i) => {
      const chip = el("button", "chip", nama);
      chip.type = "button";
      chip.setAttribute("aria-pressed", i === 0);
      chip.addEventListener("click", () => {
        wadah.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === chip));
        saatPilih(nama);
      });
      wadah.append(chip);
    });
  }

  // Navigasi bawah: pindah halaman atau beri tahu halaman belum dibuat
  function navBawah() {
    document.querySelectorAll(".nav-bawah button").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.dataset.ke) location.href = b.dataset.ke;
        else if (b.dataset.nama) toast("Halaman " + b.dataset.nama + " dibuat di tahap berikutnya.");
      });
    });
  }

  return { el, rupiah, toast, gerbang, kartu, chipKategori, navBawah, ubahJumlah, hapusItem, kosongkan, buatPesanan, pantauPesanan, batalkanPesanan, pesanLagi, cekAdmin, ubahStatus, pantauMenu, simpanProduk, hapusProduk, isiMenuContoh };
})();
