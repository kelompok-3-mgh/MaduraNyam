// MaduraNyam - dashboard. Hanya bisa dibuka setelah masuk (login).
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  let menu = [], aktif = "Semua", pantauM = null;

  // Gerbang login + profil (nama = nama pengguna yang dibuat saat daftar)
  const auth = MN.gerbang((user) => {
    const nama = user.displayName || (user.email || "").split("@")[0] || "pengguna";
    $("#nama-profil").textContent = nama;
    $("#nama-penuh").textContent = nama;
    $("#avatar").textContent = nama.charAt(0);
    $("#profil").setAttribute("aria-label", "Profil " + nama);
    if (!pantauM) pantauM = MN.pantauMenu((daftar) => { menu = daftar; bangunKategori(); gambarMenu(); });
  });
  if (!auth) return;

  // Menu profil: buka/tutup, keluar
  const tombol = $("#profil"), menuProfil = $("#menu-profil");
  const tutup = () => { menuProfil.hidden = true; tombol.setAttribute("aria-expanded", "false"); };
  tombol.addEventListener("click", (e) => {
    e.stopPropagation();
    const buka = menuProfil.hidden;
    menuProfil.hidden = !buka; tombol.setAttribute("aria-expanded", buka);
  });
  document.addEventListener("click", (e) => { if (!menuProfil.contains(e.target)) tutup(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menuProfil.hidden) { tutup(); tombol.focus(); } });
  $("#keluar").addEventListener("click", () => { auth.signOut().catch(() => MN.toast("Gagal keluar. Coba lagi.")); });

  // Salam sesuai waktu
  const jam = new Date().getHours();
  $("#salam").textContent = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 18 ? "Selamat sore" : "Selamat malam";

  // Kategori + menu populer (data dari database)
  function bangunKategori() {
    const daftar = ["Semua", ...new Set(menu.map((m) => m.kategori))];
    if (!daftar.includes(aktif)) aktif = "Semua";
    const w = $("#kategori"); w.replaceChildren();
    MN.chipKategori(w, daftar, (k) => { aktif = k; gambarMenu(); });
    w.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.textContent === aktif));
  }
  function gambarMenu() {
    const grid = $("#menu"); grid.replaceChildren();
    menu.filter((m) => aktif === "Semua" || m.kategori === aktif).forEach((m) => grid.append(MN.kartu(m)));
    if (!menu.length) grid.append(MN.el("p", "kosong-menu", "Menu belum tersedia."));
  }
  MN.navBawah();
})();
