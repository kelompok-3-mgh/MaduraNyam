// MaduraNyam - halaman Keranjang. Isi keranjang tersimpan di database (Firestore).
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  if (!MN.gerbang(() => {}, render)) return;

  // Tombol kembali: ke halaman sebelumnya (atau dashboard jika dibuka langsung)
  $("#kembali").addEventListener("click", () => {
    let dalam = false;
    try { dalam = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
    if (dalam && history.length > 1) history.back(); else location.href = "dashboard.html";
  });

  function baris(it) {
    const el = MN.el;
    const kurang = el("button", "", "\u2212"), tambah = el("button", "", "+"), jumlah = el("output", "", String(it.jumlah));
    kurang.type = tambah.type = "button";
    kurang.setAttribute("aria-label", "Kurangi jumlah " + it.nama);
    tambah.setAttribute("aria-label", "Tambah jumlah " + it.nama);
    kurang.dataset.fokus = it.id + ":kurang"; tambah.dataset.fokus = it.id + ":tambah";
    kurang.addEventListener("click", () => MN.ubahJumlah(it, -1));
    tambah.addEventListener("click", () => MN.ubahJumlah(it, 1));
    const stepper = el("div", "jumlah"); stepper.append(kurang, jumlah, tambah);

    const hapus = el("button", "hapus"), ikon = el("i", "ik ik-sampah");
    hapus.type = "button"; ikon.setAttribute("aria-hidden", "true"); hapus.append(ikon);
    hapus.setAttribute("aria-label", "Hapus " + it.nama + " dari keranjang");
    hapus.dataset.fokus = it.id + ":hapus";
    hapus.addEventListener("click", () => MN.hapusItem(it.id));

    const gambar = el("div", "gambar-kecil", it.ikon); gambar.setAttribute("aria-hidden", "true");
    const detail = el("div", "detail"); detail.append(el("h3", "", it.nama), el("p", "harga-satuan", MN.rupiah(it.harga)), stepper);
    const sisi = el("div", "sisi"); sisi.append(el("span", "subtotal", MN.rupiah(it.harga * it.jumlah)), hapus);
    const row = el("article", "baris-item"); row.append(gambar, detail, sisi);
    return row;
  }

  function render(items) {
    const aktif = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fokus : null;
    const daftar = $("#daftar"); daftar.replaceChildren();
    const kosong = items.length === 0;
    $("#kosong").hidden = !kosong; $("#ringkasan").hidden = kosong;
    let total = 0, jml = 0;
    items.forEach((it) => { total += it.harga * it.jumlah; jml += it.jumlah; daftar.append(baris(it)); });
    $("#jumlah-item").textContent = kosong ? "" : items.length + " jenis menu";
    $("#total").textContent = MN.rupiah(total);
    $("#total-item").textContent = String(jml);
    if (aktif) { const n = document.querySelector('[data-fokus="' + aktif + '"]'); if (n) n.focus(); }
  }

  $("#pesan").addEventListener("click", () => MN.toast("Pemesanan dibuat di tahap berikutnya."));
  $("#kosongkan").addEventListener("click", () => { if (confirm("Kosongkan semua isi keranjang?")) MN.kosongkan(); });
  MN.navBawah();
})();
