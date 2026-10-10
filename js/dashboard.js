// MaduraNyam - dashboard. Hanya bisa dibuka setelah masuk (login).
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const auth = (typeof firebase !== "undefined" && firebase.apps.length && typeof firebase.auth === "function") ? firebase.auth() : null;
  if (!auth) { location.replace("login.html"); return; }

  function toast(teks) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = teks;
    document.body.append(t); setTimeout(() => t.remove(), 3200);
  }
  const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");
  const el = (tag, kelas, teks) => { const n = document.createElement(tag); if (kelas) n.className = kelas; if (teks) n.textContent = teks; return n; };

  // Gerbang login + profil (nama = nama pengguna yang dibuat saat daftar)
  auth.onAuthStateChanged((user) => {
    if (!user) { location.replace("login.html"); return; }
    const nama = user.displayName || (user.email || "").split("@")[0] || "pengguna";
    $("#nama-profil").textContent = nama;
    $("#nama-penuh").textContent = nama;
    $("#avatar").textContent = nama.charAt(0);
    $("#profil").setAttribute("aria-label", "Profil " + nama);
    document.body.classList.remove("menunggu");
    const awal = $("#awal"); if (awal) awal.remove();
  });

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
  $("#keluar").addEventListener("click", () => { auth.signOut().catch(() => toast("Gagal keluar. Coba lagi.")); });

  // Salam sesuai waktu
  const jam = new Date().getHours();
  $("#salam").textContent = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 18 ? "Selamat sore" : "Selamat malam";

  // Kategori + daftar menu
  const kategori = ["Semua", ...new Set(MENU_CONTOH.map((m) => m.kategori))];
  let aktif = "Semua";
  function gambarMenu() {
    const grid = $("#menu"); grid.replaceChildren();
    MENU_CONTOH.filter((m) => aktif === "Semua" || m.kategori === aktif).forEach((m) => {
      const kartu = el("article", "kartu"), baris = el("div", "baris");
      const tambah = el("button", "tambah", "+");
      tambah.type = "button"; tambah.setAttribute("aria-label", "Tambah " + m.nama + " ke keranjang");
      tambah.addEventListener("click", () => toast("Keranjang dibuat di tahap berikutnya."));
      const gambar = el("div", "gambar", m.ikon); gambar.setAttribute("aria-hidden", "true");
      baris.append(el("span", "harga", rupiah(m.harga)), tambah);
      kartu.append(gambar, el("h3", "", m.nama), el("p", "info", m.info), baris);
      grid.append(kartu);
    });
  }
  const wadah = $("#kategori");
  kategori.forEach((k) => {
    const chip = el("button", "chip", k);
    chip.type = "button"; chip.setAttribute("aria-pressed", k === aktif);
    chip.addEventListener("click", () => {
      aktif = k;
      wadah.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === chip));
      gambarMenu();
    });
    wadah.append(chip);
  });
  gambarMenu();

  // Navigasi bawah (halaman lain dibuat di tahap berikutnya)
  document.querySelectorAll(".nav-bawah button[data-nama]").forEach((b) => {
    b.addEventListener("click", () => toast("Halaman " + b.dataset.nama + " dibuat di tahap berikutnya."));
  });
})();
