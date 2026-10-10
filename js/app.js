// MaduraNyam - setelah animasi loading, lanjut ke halaman login.
const WAKTU_LOADING = 2800;

document.addEventListener("DOMContentLoaded", () => {
  console.log("[MaduraNyam] Database:", db ? "terhubung" : "belum terhubung (isi js/firebase-config.js)");
  setTimeout(() => {
    document.querySelector(".loading").classList.add("keluar");
    setTimeout(() => location.replace("login.html"), 350);
  }, WAKTU_LOADING);
});
