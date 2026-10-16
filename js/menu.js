// MaduraNyam - halaman Menu: cari, saring, dan kelola produk (tambah, ubah, hapus, ganti foto). Hanya bisa dibuka setelah masuk.
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const IKON_DEFAULT = "\uD83C\uDF7D\uFE0F";
  let menu = [], kategori = "Semua", kelola = false, edit = null, foto = "", pantau = null;

  const auth = MN.gerbang(() => {
    if (!pantau) pantau = MN.pantauMenu((daftar) => { menu = daftar; bangunKategori(); tampil(); });
  });
  if (!auth) return;

  // Tombol kembali: ke halaman sebelumnya (atau dashboard jika dibuka langsung)
  $("#kembali").addEventListener("click", () => {
    let dalam = false;
    try { dalam = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (dalam && history.length > 1) history.back(); else location.href = "dashboard.html";
  });

  function bangunKategori() {
    const semua = [...new Set(menu.map((m) => m.kategori))];
    if (kategori !== "Semua" && !semua.includes(kategori)) kategori = "Semua";
    const w = $("#kategori"); w.replaceChildren();
    MN.chipKategori(w, ["Semua", ...semua], (k) => { kategori = k; tampil(); });
    w.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.textContent === kategori));
    $("#daftar-kategori").replaceChildren(...semua.map((k) => { const o = document.createElement("option"); o.value = k; return o; }));
  }

  function tampil() {
    const q = $("#cari").value.trim().toLowerCase();
    const hasil = menu.filter((m) =>
      (kategori === "Semua" || m.kategori === kategori) &&
      (!q || ((m.nama || "") + " " + (m.info || "") + " " + (m.kategori || "")).toLowerCase().includes(q))
    );
    const aksi = kelola ? { ubah: buka, hapus: hapus } : null;
    const grid = $("#menu"); grid.replaceChildren();
    hasil.forEach((m) => grid.append(MN.kartu(m, aksi)));
    $("#hasil").textContent = hasil.length + " menu";
    $("#menu-belum").hidden = menu.length > 0;
    $("#kosong").hidden = hasil.length > 0 || menu.length === 0;
  }

  // ---------- Mode kelola ----------
  $("#kelola").addEventListener("click", () => {
    kelola = !kelola;
    $("#kelola").setAttribute("aria-pressed", kelola);
    $("#kelola").textContent = kelola ? "Selesai" : "Kelola";
    $("#tambah-produk").hidden = !kelola;
    tampil();
  });
  $("#isi-contoh").addEventListener("click", async () => {
    if (await MN.isiMenuContoh()) MN.toast("Menu contoh ditambahkan.");
  });
  async function hapus(m) {
    if (confirm("Hapus \"" + m.nama + "\" dari menu?") && await MN.hapusProduk(m.id)) MN.toast("Produk dihapus.");
  }

  // ---------- Dialog tambah / ubah produk ----------
  const dlg = $("#dialog-produk");
  const galat = (id, teks) => { $("#galat-" + id).textContent = teks || ""; };

  function pratinjau() {
    const p = $("#pratinjau"); p.replaceChildren();
    if (foto) { const img = document.createElement("img"); img.src = foto; img.alt = ""; p.append(img); }
    else p.textContent = $("#ikon").value.trim() || IKON_DEFAULT;
    $("#hapus-foto").hidden = !foto;
  }

  function buka(m) {
    edit = m || null; foto = m ? (m.foto || "") : "";
    $("#judul-dialog").textContent = m ? "Ubah produk" : "Tambah produk";
    $("#nama").value = m ? m.nama : "";
    $("#kategori-produk").value = m ? m.kategori : (kategori !== "Semua" ? kategori : "");
    $("#harga").value = m ? m.harga : "";
    $("#info").value = m ? (m.info || "") : "";
    $("#ikon").value = m ? (m.ikon || IKON_DEFAULT) : IKON_DEFAULT;
    ["foto", "nama", "kategori", "harga"].forEach((i) => galat(i, ""));
    pratinjau();
    dlg.showModal();
  }
  $("#tambah-produk").addEventListener("click", () => buka(null));
  $("#batal-produk").addEventListener("click", () => dlg.close());
  $("#ikon").addEventListener("input", pratinjau);
  $("#hapus-foto").addEventListener("click", () => { foto = ""; pratinjau(); });

  // Kecilkan foto (maks. 640 px, JPEG) supaya muat di database
  function kecilkan(file) {
    return new Promise((ok, gagal) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const skala = Math.min(1, 640 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * skala)); c.height = Math.max(1, Math.round(img.height * skala));
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const hasil = c.toDataURL("image/jpeg", 0.8);
        hasil.length > 700000 ? gagal(new Error("besar")) : ok(hasil);
      };
      img.onerror = () => { URL.revokeObjectURL(url); gagal(new Error("baca")); };
      img.src = url;
    });
  }
  $("#foto").addEventListener("change", async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    try { foto = await kecilkan(file); galat("foto", ""); pratinjau(); }
    catch (err) { galat("foto", "Foto tidak bisa dipakai. Gunakan foto JPG atau PNG."); }
  });

  $("#form-produk").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = $("#nama").value.trim(), kat = $("#kategori-produk").value.trim();
    const harga = Number($("#harga").value), info = $("#info").value.trim(), ikon = $("#ikon").value.trim() || IKON_DEFAULT;
    const en = nama.length < 2 ? "Isi nama produk (minimal 2 huruf)." : "";
    const ek = kat ? "" : "Isi kategori, misalnya Sate.";
    const eh = $("#harga").value !== "" && Number.isInteger(harga) && harga > 0 && harga <= 10000000 ? "" : "Isi harga dengan angka bulat, misalnya 20000.";
    galat("nama", en); galat("kategori", ek); galat("harga", eh);
    if (en || ek || eh) return;
    const btn = $("#simpan-produk"); btn.disabled = true; btn.classList.add("memuat");
    const ok = await MN.simpanProduk(edit && edit.id, { nama, kategori: kat, harga, info, ikon, foto });
    btn.disabled = false; btn.classList.remove("memuat");
    if (ok) { dlg.close(); MN.toast(edit ? "Produk diperbarui." : "Produk ditambahkan."); }
  });

  $("#cari").addEventListener("input", tampil);
  MN.navBawah();
})();
