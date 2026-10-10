// MaduraNyam - setelah animasi loading: ke dashboard jika sudah masuk, jika belum ke login.
const WAKTU_LOADING = 2800;

const authSiap = new Promise((selesai) => {
  if (typeof firebase === "undefined" || !firebase.apps.length || typeof firebase.auth !== "function") return selesai(null);
  const batal = firebase.auth().onAuthStateChanged((user) => { batal(); selesai(user); }, () => selesai(null));
  setTimeout(() => selesai(null), 6000);
});

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[MaduraNyam] Database:", db ? "terhubung" : "belum terhubung (isi js/firebase-config.js)");
  const [user] = await Promise.all([authSiap, new Promise((r) => setTimeout(r, WAKTU_LOADING))]);
  document.querySelector(".loading").classList.add("keluar");
  setTimeout(() => location.replace(user ? "dashboard.html" : "login.html"), 350);
});
