// MaduraNyam - tahap 1: tampilan loading.
// Tahap berikutnya ditambahkan setelah ada instruksi.
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "[MaduraNyam] Tampilan loading siap. Database:",
    db ? "terhubung" : "belum terhubung (isi js/firebase-config.js)"
  );
});
