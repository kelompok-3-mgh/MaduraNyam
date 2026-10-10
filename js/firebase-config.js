// Konfigurasi database Firebase (Firestore) untuk MaduraNyam.
// Ganti nilai ISI_... dengan konfigurasi dari Firebase Console:
// Project settings > Your apps > Web app > SDK setup and configuration.
const firebaseConfig = {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_PROJECT_ID.firebaseapp.com",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_PROJECT_ID.appspot.com",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID"
};

// Objek database yang dipakai di seluruh aplikasi (null jika belum terhubung)
let db = null;

try {
  const sudahDiisi = firebaseConfig.apiKey !== "ISI_API_KEY";
  if (typeof firebase !== "undefined" && sudahDiisi) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
  }
} catch (error) {
  console.error("[MaduraNyam] Gagal menghubungkan database:", error);
}
