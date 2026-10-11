// MaduraNyam - halaman Menu: cari dan saring menu. Hanya bisa dibuka setelah masuk.
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  if (!MN.gerbang(() => {})) return;

  // Tombol kembali: ke halaman sebelumnya (atau dashboard jika dibuka langsung)
  $("#kembali").addEventListener("click", () => {
    let dalam = false;
    try { dalam = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (dalam && history.length > 1) history.back(); else location.href = "dashboard.html";
  });

  let kategori = "Semua";
  function tampil() {
    const q = $("#cari").value.trim().toLowerCase();
    const hasil = MENU_CONTOH.filter((m) =>
      (kategori === "Semua" || m.kategori === kategori) &&
      (!q || (m.nama + " " + m.info + " " + m.kategori).toLowerCase().includes(q))
    );
    const grid = $("#menu"); grid.replaceChildren();
    hasil.forEach((m) => grid.append(MN.kartu(m)));
    $("#hasil").textContent = hasil.length + " menu";
    $("#kosong").hidden = hasil.length > 0;
  }

  MN.chipKategori($("#kategori"), ["Semua", ...new Set(MENU_CONTOH.map((m) => m.kategori))], (k) => { kategori = k; tampil(); });
  $("#cari").addEventListener("input", tampil);
  MN.navBawah();
  tampil();
})();
