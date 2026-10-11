// MaduraNyam - dashboard. Hanya bisa dibuka setelah masuk (login).
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  // Gerbang login + profil (nama = nama pengguna yang dibuat saat daftar)
  const auth = MN.gerbang((user) => {
    const nama = user.displayName || (user.email || "").split("@")[0] || "pengguna";
    $("#nama-profil").textContent = nama;
    $("#nama-penuh").textContent = nama;
    $("#avatar").textContent = nama.charAt(0);
    $("#profil").setAttribute("aria-label", "Profil " + nama);
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

  // Kategori + menu populer
  let aktif = "Semua";
  function gambarMenu() {
    const grid = $("#menu"); grid.replaceChildren();
    MENU_CONTOH.filter((m) => aktif === "Semua" || m.kategori === aktif).forEach((m) => grid.append(MN.kartu(m)));
  }
  MN.chipKategori($("#kategori"), ["Semua", ...new Set(MENU_CONTOH.map((m) => m.kategori))], (k) => { aktif = k; gambarMenu(); });
  gambarMenu();
  MN.navBawah();
})();
