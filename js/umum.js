// MaduraNyam - fungsi bersama untuk halaman setelah login (dashboard, menu, dst.).
const MN = (function () {
  "use strict";

  const authAktif = () =>
    (typeof firebase !== "undefined" && firebase.apps.length && typeof firebase.auth === "function") ? firebase.auth() : null;

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

  // Gerbang login: hanya pengguna yang sudah masuk yang boleh melihat halaman
  function gerbang(saatMasuk) {
    const auth = authAktif();
    if (!auth) { location.replace("login.html"); return null; }
    auth.onAuthStateChanged((user) => {
      if (!user) { location.replace("login.html"); return; }
      saatMasuk(user);
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
    tambah.addEventListener("click", () => toast("Keranjang dibuat di tahap berikutnya."));
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

  return { el, rupiah, toast, gerbang, kartu, chipKategori, navBawah };
})();
