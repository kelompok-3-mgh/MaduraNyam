// MaduraNyam - logika halaman login, daftar, dan halaman informasi.
(function () {
  "use strict";
  const DOMAIN = "maduranyam.app";          // nama pengguna dipetakan ke "nama@maduranyam.app"
  const FORMAT = /^[a-z0-9_]{3,20}$/;
  const DASHBOARD = "dashboard.html";
  const $ = (s) => document.querySelector(s);
  const auth = (typeof firebase !== "undefined" && firebase.apps.length && typeof firebase.auth === "function") ? firebase.auth() : null;
  const BELUM = "Database belum terhubung. Isi konfigurasi Firebase di js/firebase-config.js.";
  const SALAH = "Nama pengguna atau kata sandi salah.";
  const PESAN = {
    "auth/email-already-in-use": "Nama pengguna sudah dipakai. Coba nama lain.",
    "auth/invalid-credential": SALAH, "auth/wrong-password": SALAH,
    "auth/user-not-found": SALAH, "auth/invalid-login-credentials": SALAH,
    "auth/too-many-requests": "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
    "auth/network-request-failed": "Tidak ada koneksi internet. Periksa jaringanmu.",
    "auth/weak-password": "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.",
    "auth/operation-not-allowed": "Metode masuk belum aktif. Aktifkan Email/Password di Firebase Authentication.",
    "auth/configuration-not-found": "Authentication belum diaktifkan di Firebase Console.",
    "auth/invalid-api-key": "Konfigurasi Firebase belum benar. Periksa js/firebase-config.js."
  };
  const pesan = (e) => PESAN[e && e.code] || "Terjadi kesalahan. Coba lagi.";
  const normal = (v) => v.trim().toLowerCase();
  const cekUser = (u) => !u ? "Isi nama pengguna." : FORMAT.test(u) ? "" : "Gunakan 3–20 karakter: huruf, angka, atau garis bawah (_).";

  function toast(teks) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = teks;
    document.body.append(t); setTimeout(() => t.remove(), 3600);
  }
  function galat(id, teks) {
    const p = $("#galat-" + id), el = $("#" + id), kotak = el.closest(".input");
    p.textContent = teks || ""; el.setAttribute("aria-invalid", !!teks);
    if (kotak) kotak.classList.toggle("salah", !!teks);
  }
  function kotakPesan(teks, jenis) {
    const a = $("#alert"); a.textContent = teks || "";
    a.className = "alert alert-" + (jenis || "galat"); a.hidden = !teks;
  }
  function memuat(btn, on) { btn.disabled = on; btn.classList.toggle("memuat", on); }
  async function keDashboard() {
    try {
      const r = await fetch(DASHBOARD, { method: "HEAD", cache: "no-store" });
      if (r.ok) { location.href = DASHBOARD; return; }
    } catch (e) { /* dashboard belum ada */ }
    kotakPesan("Berhasil masuk. Halaman dashboard dibuat di tahap berikutnya.", "info");
  }

  // Tombol kembali: ke halaman sebelumnya
  document.querySelectorAll("[data-kembali]").forEach((b) => b.addEventListener("click", () => {
    let dalam = false;
    try { dalam = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (dalam && history.length > 1) history.back(); else location.href = "login.html";
  }));

  // Tombol mata: tampilkan / sembunyikan kata sandi
  document.querySelectorAll(".tombol-mata").forEach((b) => {
    const input = b.parentElement.querySelector("input"), ik = b.querySelector(".ik");
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => {
      const lihat = input.type === "password";
      input.type = lihat ? "text" : "password";
      b.setAttribute("aria-pressed", lihat);
      b.setAttribute("aria-label", lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
      ik.classList.toggle("ik-mata", !lihat); ik.classList.toggle("ik-mata-coret", lihat);
    });
  });

  // Login
  const fl = $("#form-login");
  if (fl) {
    const baru = sessionStorage.getItem("mn_baru");
    if (baru) {
      sessionStorage.removeItem("mn_baru");
      $("#username").value = baru; $("#sandi").focus();
      toast("Akun berhasil dibuat. Silakan masuk.");
    }
    // Sudah punya sesi masuk: langsung ke dashboard
    if (auth) { const batal = auth.onAuthStateChanged((u) => { batal(); if (u) location.replace(DASHBOARD); }); }
    fl.addEventListener("submit", async (e) => {
      e.preventDefault(); kotakPesan("");
      const u = normal($("#username").value), s = $("#sandi").value;
      const eu = cekUser(u), es = s ? "" : "Isi kata sandi.";
      galat("username", eu); galat("sandi", es);
      if (eu || es) return;
      if (!auth) return kotakPesan(BELUM);
      const btn = $("#kirim"); memuat(btn, true);
      try { await auth.signInWithEmailAndPassword(u + "@" + DOMAIN, s); await keDashboard(); }
      catch (err) { kotakPesan(pesan(err)); }
      finally { memuat(btn, false); }
    });
  }

  // Daftar
  const fd = $("#form-daftar");
  if (fd) {
    fd.addEventListener("submit", async (e) => {
      e.preventDefault(); kotakPesan("");
      const u = normal($("#username").value), s = $("#sandi").value, k = $("#konfirmasi").value;
      const eu = cekUser(u);
      const es = s.length < 6 ? "Kata sandi minimal 6 karakter." : "";
      const ek = !es && k !== s ? "Konfirmasi kata sandi belum sama." : "";
      const ez = $("#setuju").checked ? "" : "Setujui Ketentuan Layanan dan Kebijakan Privasi untuk mendaftar.";
      galat("username", eu); galat("sandi", es); galat("konfirmasi", ek); galat("setuju", ez);
      if (eu || es || ek || ez) return;
      if (!auth) return kotakPesan(BELUM);
      const btn = $("#kirim"); memuat(btn, true);
      try {
        const c = await auth.createUserWithEmailAndPassword(u + "@" + DOMAIN, s);
        try {
          await c.user.updateProfile({ displayName: u });
          if (typeof db !== "undefined" && db) {
            await db.collection("pengguna").doc(c.user.uid).set({ username: u, dibuatPada: firebase.firestore.FieldValue.serverTimestamp() });
          }
        } catch (x) { console.warn("[MaduraNyam] Profil belum tersimpan di Firestore:", x); }
        await auth.signOut();
        sessionStorage.setItem("mn_baru", u);
        location.href = "login.html";
      } catch (err) { kotakPesan(pesan(err)); memuat(btn, false); }
    });
  }

  // Daftar anggota kelompok (Ketentuan Layanan & Kontak)
  if (typeof KELOMPOK !== "undefined") {
    const el = (tag, kelas, teks) => { const n = document.createElement(tag); if (kelas) n.className = kelas; if (teks) n.textContent = teks; return n; };
    document.querySelectorAll("[data-anggota]").forEach((daftar) => {
      const mode = daftar.dataset.anggota;
      KELOMPOK.anggota.forEach((a) => {
        const li = el("li");
        if (mode === "nim") {
          li.textContent = a.nama + " (" + a.nim + ")";
        } else if (mode === "tugas") {
          li.append(el("strong", "", a.nama), el("p", a.tugas ? "" : "kosong", a.tugas || "Pembagian tugas belum diisi."));
        } else {
          const angka = a.telepon.replace(/\D/g, "");
          const info = el("div"), tel = el("a", "tel", a.telepon), wa = el("a", "wa", "Chat WhatsApp");
          tel.href = "tel:+" + angka; wa.href = "https://wa.me/" + angka; wa.target = "_blank"; wa.rel = "noopener";
          info.append(el("strong", "", a.nama), tel); li.append(info, wa);
        }
        daftar.append(li);
      });
    });
  }
})();
