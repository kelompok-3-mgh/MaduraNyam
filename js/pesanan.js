// MaduraNyam - halaman Pesanan: buat pesanan dari keranjang dan lihat riwayat. Hanya bisa dibuka setelah masuk.
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const STATUS = { diproses: "Diproses", dimasak: "Dimasak", siap: "Siap diambil", selesai: "Selesai", dibatalkan: "Dibatalkan" };
  let itemKeranjang = [];
  let pantau = null;

  const auth = MN.gerbang(() => { if (!pantau) pantau = MN.pantauPesanan(gambarRiwayat); }, gambarRingkas);
  if (!auth) return;

  // Tombol kembali: ke halaman sebelumnya (atau dashboard jika dibuka langsung)
  $("#kembali").addEventListener("click", () => {
    let dalam = false;
    try { dalam = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (dalam && history.length > 1) history.back(); else location.href = "dashboard.html";
  });

  // Tab: Pesanan baru / Riwayat (dari keranjang dibuka dengan #baru)
  function pilihTab(nama) {
    document.querySelectorAll("#tab .chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.tab === nama));
    $("#bagian-baru").hidden = nama !== "baru";
    $("#bagian-riwayat").hidden = nama !== "riwayat";
    history.replaceState(null, "", nama === "baru" ? "#baru" : location.pathname);
    window.scrollTo(0, 0);
  }
  document.querySelectorAll("#tab .chip").forEach((c) => c.addEventListener("click", () => pilihTab(c.dataset.tab)));
  pilihTab(location.hash === "#baru" ? "baru" : "riwayat");

  // Ringkasan isi keranjang pada tab Pesanan baru
  function gambarRingkas(items) {
    itemKeranjang = items;
    const el = MN.el, kosong = items.length === 0;
    $("#kosong-baru").hidden = !kosong;
    $("#form-pesan").hidden = kosong;
    const daftar = $("#ringkas"); daftar.replaceChildren();
    let total = 0, jml = 0;
    items.forEach((it) => {
      total += it.harga * it.jumlah; jml += it.jumlah;
      const gambar = el("div", "gambar-kecil", it.ikon); gambar.setAttribute("aria-hidden", "true");
      const detail = el("div"); detail.append(el("h3", "", it.nama), el("p", "", it.jumlah + " \u00D7 " + MN.rupiah(it.harga)));
      const row = el("article", "item-ringkas"); row.append(gambar, detail, el("span", "subtotal", MN.rupiah(it.harga * it.jumlah)));
      daftar.append(row);
    });
    $("#total").textContent = MN.rupiah(total);
    $("#total-item").textContent = String(jml);
  }

  // Riwayat pesanan
  function gambarRiwayat(daftar) {
    const el = MN.el, wadah = $("#riwayat"); wadah.replaceChildren();
    $("#kosong-riwayat").hidden = daftar.length > 0;
    $("#jumlah-pesanan").textContent = daftar.length ? daftar.length + " pesanan" : "";
    daftar.forEach((p) => {
      const kode = "MN-" + p.id.slice(0, 6).toUpperCase();
      const tgl = p.dibuatPada && p.dibuatPada.toDate
        ? p.dibuatPada.toDate().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "";
      const kiri = el("div"); kiri.append(el("h3", "", kode), el("p", "waktu", tgl));
      const atas = el("div", "pesanan-atas"); atas.append(kiri, el("span", "status status-" + p.status, STATUS[p.status] || p.status));

      const isi = el("ul");
      (p.item || []).forEach((it) => {
        const li = el("li"); li.append(el("span", "", it.jumlah + "\u00D7 " + it.nama), el("span", "", MN.rupiah(it.harga * it.jumlah)));
        isi.append(li);
      });
      const bawah = el("div", "pesanan-bawah"); bawah.append(el("p", "meta", p.metode || ""), el("strong", "total-pesanan", MN.rupiah(p.total)));

      const kartu = el("article", "pesanan"); kartu.append(atas, isi, bawah);
      if (p.catatan) kartu.append(el("p", "catatan-pesanan", "Catatan: " + p.catatan));
      if (p.status === "diproses") {
        const batal = el("button", "batal", "Batalkan pesanan"); batal.type = "button";
        batal.addEventListener("click", () => { if (confirm("Batalkan pesanan " + kode + "?")) MN.batalkanPesanan(p.id); });
        kartu.append(batal);
      }
      wadah.append(kartu);
    });
  }

  // Kirim pesanan
  $("#form-pesan").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!itemKeranjang.length) return;
    const btn = $("#kirim"); btn.disabled = true; btn.classList.add("memuat");
    const metode = document.querySelector('input[name="metode"]:checked').value;
    const ok = await MN.buatPesanan(itemKeranjang, { metode, catatan: $("#catatan").value.trim() });
    btn.disabled = false; btn.classList.remove("memuat");
    if (ok) { $("#catatan").value = ""; MN.toast("Pesanan berhasil dibuat."); pilihTab("riwayat"); }
  });

  MN.navBawah();
})();
