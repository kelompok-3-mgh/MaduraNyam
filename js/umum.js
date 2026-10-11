// MaduraNyam - fungsi bersama untuk halaman setelah login (dashboard, menu, keranjang, dst.).
const MN = (function () {
  "use strict";

  let uidAktif = null;
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
        item: { [idMenu(m)]: { nama: m.nama, harga: m.harga, ikon: m.ikon, jumlah: F.increment(1) } },
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

  // ---------- Halaman ----------
  // Gerbang login: hanya pengguna yang sudah masuk yang boleh melihat halaman
  function gerbang(saatMasuk, saatKeranjang) {
    const auth = authAktif();
    if (!auth) { location.replace("login.html"); return null; }
    auth.onAuthStateChanged((user) => {
      if (!user) { location.replace("login.html"); return; }
      uidAktif = user.uid;
      saatMasuk(user);
      if (!berlangganan) berlangganan = pantauKeranjang(saatKeranjang);
      document.body.classList.remove("menunggu");
      const awal = document.getElementById("awal");
      if (awal) awal.remove();
    });
    return auth;
  }

  // Kartu menu
  function kartu(m) {
    const k = el("article", "kartu"), baris = el("div", "baris"), tambah = el("button", "tambah", "+");
    tambah.type = "button";
    tambah.setAttribute("aria-label", "Tambah " + m.nama + " ke keranjang");
    tambah.addEventListener("click", () => tambahKeKeranjang(m));
    const gambar = el("div", "gambar", m.ikon);
    gambar.setAttribute("aria-hidden", "true");
    baris.append(el("span", "harga", rupiah(m.harga)), tambah);
    k.append(gambar, el("h3", "", m.nama), el("p", "info", m.info), baris);
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

  return { el, rupiah, toast, gerbang, kartu, chipKategori, navBawah, ubahJumlah, hapusItem, kosongkan };
})();
