/* Product page: product.html?id=scrub (ids are the keys of CATALOG in store.js) */
(() => {
  const root = document.getElementById("pd");
  const id = new URLSearchParams(location.search).get("id");
  const p = CATALOG[id];
  const tick = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  if(!p){
    document.title = "Product not found — Skintreat by AK";
    root.innerHTML = `<div class="co-empty"><h1 class="co-title">We couldn’t find that product</h1><p>It may have moved. Have a look at the full range.</p><a class="btn btn-primary" href="index.html#products">Browse products</a></div>`;
    return;
  }

  document.title = `${p.name} — Skintreat by AK`;
  document.querySelector('meta[name="robots"]').insertAdjacentHTML("afterend", `<meta name="description" content="${esc(p.desc)}">`);
  const free = SHOP.freeDeliveryFrom > 0 ? `Free delivery on orders over ${money(SHOP.freeDeliveryFrom)}, otherwise ${money(SHOP.deliveryFee)}.` : `Delivery ${money(SHOP.deliveryFee)}.`;

  root.innerHTML = `
    <p class="crumbs"><a href="index.html#products">Shop</a> / ${esc(p.name)}</p>
    <article class="pd" data-line="${p.line}">
      <div class="pd-pic"><img src="${p.image}" alt="${esc(p.alt)}"></div>
      <div class="pd-copy">
        <span class="line">Skintreat by AK</span>
        <h1>${esc(p.name)}</h1>
        <div class="pd-price">${money(p.price)}<small>${esc(p.size)}</small></div>
        <p class="desc">${esc(p.desc)}</p>
        <ul class="benefits">${p.benefits.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
        <div class="pd-buy" data-qty-scope>
          ${qtyHTML(1, "Quantity")}
          <button class="btn add" type="button" data-add="${id}">${ICON_BAG}<span>Add to cart</span></button>
          <button class="btn btn-ghost" type="button" data-add="${id}" data-go="checkout.html">Buy now</button>
        </div>
        <ul class="pd-notes">
          <li>${tick}<span><b>Delivery island-wide.</b> ${free}</span></li>
          <li>${tick}<span><b>Pay your way.</b> Card online, or cash on delivery.</span></li>
          <li>${tick}<span><b>In your routine.</b> ${esc(p.routine)}</span></li>
          <li>${tick}<span><b>Sensitive skin?</b> Do a patch test on your inner arm first.</span></li>
        </ul>
      </div>
    </article>
    <section class="related">
      <h2>You may also like</h2>
      <div class="mini-grid">${Object.entries(CATALOG).filter(([k]) => k !== id).map(([k, o]) => `
        <a class="mini" href="product.html?id=${k}"><img src="${o.image}" alt="" loading="lazy"><div><b>${esc(o.name)}</b><span>${money(o.price)} · ${esc(o.size)}</span></div></a>`).join("")}
      </div>
    </section>`;
})();
