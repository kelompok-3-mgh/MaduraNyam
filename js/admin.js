// MaduraNyam - halaman Admin: lihat semua pesanan dan ubah statusnya. Hanya untuk akun yang terdaftar di koleksi "admin".
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const STATUS = { diproses: "Diproses", dimasak: "Dimasak", siap: "Siap diambil", selesai: "Selesai", dibatalkan: "Dibatalkan" };
  const LANJUT = { diproses: "dimasak", dimasak: "siap", siap: "selesai" };
  let semua = [], saring = "Semua", pantau = null;

  const auth = MN.gerbang(async () => {
    if (pantau) return;
    if (!(await MN.cekAdmin())) {
      MN.toast("Halaman ini hanya untuk admin.");
      setTimeout(() => location.replace("dashboard.html"), 1400);
      return;
    }
    pantau = MN.pantauPesanan((daftar) => { semua = daftar; gambar(); }, true);
  }, () => {});
  if (!auth) return;

  $("#kembali").addEventListener("click", () => {
    let dalam = false;
    try { dalam = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (dalam && history.length > 1) history.back(); else location.href = "dashboard.html";
  });

  function gambar() {
    const el = MN.el, wadah = $("#daftar"); wadah.replaceChildren();
    const hasil = semua.filter((p) => saring === "Semua" || STATUS[p.status] === saring);
    $("#hasil").textContent = hasil.length + " pesanan";
    $("#kosong").hidden = hasil.length > 0;
    hasil.forEach((p) => {
      const kode = "MN-" + p.id.slice(0, 6).toUpperCase();
      const tgl = p.dibuatPada && p.dibuatPada.toDate
        ? p.dibuatPada.toDate().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "";
      const kiri = el("div"); kiri.append(el("h3", "", kode), el("p", "waktu", tgl), el("p", "pemesan", "Pemesan: " + (p.pemesan || "-")));
      const atas = el("div", "pesanan-atas"); atas.append(kiri, el("span", "status status-" + p.status, STATUS[p.status] || p.status));

      const isi = el("ul");
      (p.item || []).forEach((it) => {
        const li = el("li"); li.append(el("span", "", it.jumlah + "\u00D7 " + it.nama), el("span", "", MN.rupiah(it.harga * it.jumlah)));
        isi.append(li);
      });
      const bawah = el("div", "pesanan-bawah"); bawah.append(el("p", "meta", p.metode || ""), el("strong", "total-pesanan", MN.rupiah(p.total)));

      const kartu = el("article", "pesanan"); kartu.append(atas, isi, bawah);
      if (p.catatan) kartu.append(el("p", "catatan-pesanan", "Catatan: " + p.catatan));

      if (LANJUT[p.status]) {
        const aksi = el("div", "aksi");
        const lanjut = el("button", "ulang", "Tandai " + STATUS[LANJUT[p.status]]); lanjut.type = "button";
        lanjut.addEventListener("click", () => MN.ubahStatus(p.id, LANJUT[p.status]));
        const batal = el("button", "batal", "Batalkan"); batal.type = "button";
        batal.addEventListener("click", () => { if (confirm("Batalkan pesanan " + kode + "?")) MN.ubahStatus(p.id, "dibatalkan"); });
        aksi.append(lanjut, batal); kartu.append(aksi);
      }
      wadah.append(kartu);
    });
  }

  MN.chipKategori($("#kategori"), ["Semua", ...Object.values(STATUS)], (k) => { saring = k; gambar(); });
})();
