// Konfigurasi database Firebase (Firestore + Authentication) untuk MaduraNyam.
// Proyek Firebase: kelompok3
const firebaseConfig = {
  apiKey: "AIzaSyAifowL31I13GvYOjyzVlDi9D9B-nofcyw",
  authDomain: "kelompok3-6a94e.firebaseapp.com",
  projectId: "kelompok3-6a94e",
  storageBucket: "kelompok3-6a94e.firebasestorage.app",
  messagingSenderId: "925748726640",
  appId: "1:925748726640:web:83cb008e1bf74b7b4c1db5"
};

// Objek database yang dipakai di seluruh aplikasi (null jika belum terhubung)
let db = null;

try {
  const sudahDiisi = !firebaseConfig.apiKey.startsWith("ISI_");
  if (typeof firebase !== "undefined" && sudahDiisi) {
    firebase.initializeApp(firebaseConfig);
    if (typeof firebase.firestore === "function") db = firebase.firestore();
  }
} catch (error) {
  console.error("[MaduraNyam] Gagal menghubungkan database:", error);
}
