/* =====================================================================
   SHOP SETTINGS - prices, delivery and payment rules live here.
   Every page loads this file first, so change a price once and it
   updates the product cards, product pages, cart and checkout.
   ===================================================================== */
const SHOP = {
  name: "Skintreat by AK",
  whatsapp: "94XXXXXXXXX",   // country code + number, no "+", no spaces, no leading 0
  currency: "LKR",
  deliveryFee: 400,          // flat island-wide delivery charge
  freeDeliveryFrom: 5000,    // subtotal that unlocks free delivery (0 = never free)
  codFee: 0,                 // extra charge for cash on delivery (0 = none)
  codLimit: 20000,           // cash on delivery is not offered above this total
  maxQty: 10                 // most of one product per order
};

/* PLACEHOLDER PRICES - replace with your real prices before going live. */
const CATALOG = {
  scrub: {
    name: "Coffee Scrub", price: 1850, size: "Face & body", line: "coffee",
    image: "images/coffee-scrub.jpg",
    alt: "Skintreat Coffee Scrub jar with coffee beans, a wooden scoop and a cup of coffee",
    desc: "A coffee scrub for face and body, in a gold-lidded jar.",
    benefits: ["Coffee", "Face & body", "Scrub"],
    routine: "Step 3 of the routine: scrub face and body."
  },
  gel: {
    name: "Gotu Kola Gel 99%", price: 1650, size: "100 ml", line: "gotu",
    image: "images/gotu-kola-gel.jpg",
    alt: "Hand holding a bottle of Skintreat Gotu Kola Gel 99%",
    desc: "An all-in-one gotu kola gel for face, body and hair. Use it as a natural hair gel, or for acne, pigmentation and dark circles.",
    benefits: ["All in one", "Acne & pigmentation", "Dark circles", "Natural hair gel", "Unisex"],
    routine: "Step 4 of the routine: treat acne, pigmentation and dark circles."
  },
  oil: {
    name: "Aloe Vera Hair Growth Oil", price: 1450, size: "100 ml", line: "aloe",
    image: "images/aloe-vera-hair-growth-oil.jpg",
    alt: "Skintreat Aloe Vera Hair Growth Oil bottle",
    desc: "An aloe vera hair oil for anti hair fall and hair growth.",
    benefits: ["Aloe vera", "Anti hair fall", "Hair growth"],
    routine: "For anti hair fall and hair growth."
  },
  shampoo: {
    name: "4 in 1 Strengthening Shampoo", price: 2250, size: "300 ml", line: "rose",
    image: "images/strengthening-shampoo.jpg",
    alt: "Skintreat 4 in 1 Strengthening Shampoo pump bottle",
    desc: "A strengthening shampoo with rosemary, neem, gotu kola and moringa, for a longer, healthier hair.",
    benefits: ["Rosemary", "Neem", "Gotu kola", "Moringa"],
    routine: "Step 1 of the routine: wash."
  },
  serum: {
    name: "Rice & Flaxseed Hair Serum", price: 1750, size: "100 ml", line: "rice",
    image: "images/rice-flaxseed-hair-serum.jpg",
    alt: "Hand holding a bottle of Skintreat Rice & Flaxseed After Bath Hair Serum",
    desc: "An after bath hair serum made with rice and flaxseed.",
    benefits: ["Rice", "Flaxseed", "After bath", "Unisex"],
    routine: "Step 2 of the routine: after bath, on your hair."
  }
};

/* --- Helpers --- */
const money = n => `${SHOP.currency} ${Math.round(n).toLocaleString("en-LK")}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clampQty = n => Math.min(SHOP.maxQty, Math.max(1, parseInt(n, 10) || 1));
const store = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch{ return fallback; } },
  set(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch{} }
};
const ICON_BAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';

/* Subtotal, delivery and total for a list of cart lines and a payment method. */
function orderTotals(lines, payment){
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const free = SHOP.freeDeliveryFrom > 0 && subtotal >= SHOP.freeDeliveryFrom;
  const delivery = subtotal === 0 || free ? 0 : SHOP.deliveryFee;
  const codFee = payment === "cod" ? SHOP.codFee : 0;
  return {subtotal, delivery, codFee, total: subtotal + delivery + codFee};
}

/* --- Cart: kept in this browser, synced across open tabs --- */
const Cart = (() => {
  const KEY = "skintreat.cart";
  const listeners = new Set();
  const clean = raw => (Array.isArray(raw) ? raw : [])
    .filter(i => i && CATALOG[i.id])
    .map(i => ({id: i.id, qty: clampQty(i.qty)}));
  let items = clean(store.get(KEY, []));
  const commit = () => { store.set(KEY, items); listeners.forEach(fn => fn()); };
  addEventListener("storage", e => { if(e.key === KEY){ items = clean(store.get(KEY, [])); listeners.forEach(fn => fn()); } });
  return {
    lines: () => items.map(i => ({...i, product: CATALOG[i.id], total: CATALOG[i.id].price * i.qty})),
    count: () => items.reduce((n, i) => n + i.qty, 0),
    add(id, qty = 1){
      const hit = items.find(i => i.id === id);
      if(hit) hit.qty = clampQty(hit.qty + qty); else items.push({id, qty: clampQty(qty)});
      commit();
    },
    set(id, qty){ const hit = items.find(i => i.id === id); if(hit){ hit.qty = clampQty(qty); commit(); } },
    remove(id){ items = items.filter(i => i.id !== id); commit(); },
    clear(){ items = []; commit(); },
    onChange(fn){ listeners.add(fn); }
  };
})();

/* --- Quantity steppers: any .qty with an <input> and [data-step] buttons --- */
function qtyHTML(value, label, id = ""){
  const data = id ? ` data-id="${id}"` : "";
  return `<div class="qty"><button type="button" data-step="-1"${data} aria-label="Decrease ${esc(label)}">−</button>`
    + `<input type="number" inputmode="numeric" min="1" max="${SHOP.maxQty}" value="${value}"${data} aria-label="${esc(label)}">`
    + `<button type="button" data-step="1"${data} aria-label="Increase ${esc(label)}">+</button></div>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest(".qty [data-step]");
  if(!b) return;
  const input = b.parentElement.querySelector("input");
  const next = clampQty(+input.value + +b.dataset.step);
  if(next === +input.value) return;
  input.value = next;
  input.dispatchEvent(new Event("change", {bubbles: true}));
});
document.addEventListener("change", e => { if(e.target.matches(".qty input")) e.target.value = clampQty(e.target.value); }, true);

/* --- Buy boxes: <div data-buy="id"> becomes price + quantity + Add to cart --- */
function renderBuyBoxes(){
  document.querySelectorAll("[data-buy]").forEach(box => {
    const p = CATALOG[box.dataset.buy];
    if(!p) return;
    const more = box.hasAttribute("data-details") ? `<a class="more" href="product.html?id=${box.dataset.buy}">Details</a>` : "";
    box.innerHTML = `<div class="price">${money(p.price)}<small>${esc(p.size)}</small></div>`
      + `<div class="buy-actions">${qtyHTML(1, "Quantity")}`
      + `<button class="btn add" type="button" data-add="${box.dataset.buy}">${ICON_BAG}<span>Add to cart</span></button>${more}</div>`;
  });
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if(!b) return;
  const input = b.closest("[data-buy], [data-qty-scope]")?.querySelector(".qty input");
  Cart.add(b.dataset.add, input ? clampQty(input.value) : 1);
  if(input) input.value = 1;
  const label = b.querySelector("span");
  if(label){ label.textContent = "Added"; clearTimeout(b._t); b._t = setTimeout(() => label.textContent = "Add to cart", 1600); }
  if(b.dataset.go){ location.href = b.dataset.go; return; }
  CartDrawer.open(b);
});

/* --- Cart drawer, shared by every page --- */
const CartDrawer = (() => {
  const dlg = document.createElement("dialog");
  dlg.className = "cart";
  dlg.setAttribute("aria-labelledby", "cartTitle");
  dlg.innerHTML = `<div class="cart-panel">
      <div class="cart-head"><h2 id="cartTitle">Your cart</h2><button class="cart-x" type="button" data-cart-close aria-label="Close cart">×</button></div>
      <div class="cart-body"></div>
      <div class="cart-foot"></div>
    </div>`;
  document.body.append(dlg);
  const body = dlg.querySelector(".cart-body"), foot = dlg.querySelector(".cart-foot");
  let opener = null;

  function render(){
    const lines = Cart.lines();
    // keep focus on the same control after re-rendering
    const f = document.activeElement;
    const keep = !dlg.contains(f) ? null
      : f.dataset.step ? `[data-id="${f.dataset.id}"][data-step="${f.dataset.step}"]`
      : f.tagName === "INPUT" ? `input[data-id="${f.dataset.id}"]`
      : f.dataset.remove ? ".cart-x" : null;
    if(!lines.length){
      body.innerHTML = `<div class="cart-empty">${ICON_BAG}<p>Your cart is empty.</p><a class="btn btn-ghost" href="index.html#products" data-cart-close>Browse products</a></div>`;
      foot.innerHTML = "";
    }else{
      body.innerHTML = `<ul class="cart-lines">${lines.map(l => `
        <li class="cl">
          <a class="cl-pic" href="product.html?id=${l.id}"><img src="${l.product.image}" alt=""></a>
          <div class="cl-info">
            <a class="cl-name" href="product.html?id=${l.id}">${esc(l.product.name)}</a>
            <span class="cl-meta">${money(l.product.price)} · ${esc(l.product.size)}</span>
            ${qtyHTML(l.qty, `Quantity of ${l.product.name}`, l.id)}
          </div>
          <div class="cl-end"><b>${money(l.total)}</b><button type="button" class="cl-rm" data-remove="${l.id}" aria-label="Remove ${esc(l.product.name)}">Remove</button></div>
        </li>`).join("")}</ul>`;
      const t = orderTotals(lines);
      const gap = SHOP.freeDeliveryFrom - t.subtotal;
      const note = SHOP.freeDeliveryFrom > 0
        ? (gap > 0 ? `Add ${money(gap)} more for free delivery.` : "You’ve unlocked free delivery.")
        : "";
      const pct = SHOP.freeDeliveryFrom > 0 ? Math.min(100, t.subtotal / SHOP.freeDeliveryFrom * 100) : 100;
      foot.innerHTML = `
        ${note ? `<div class="ship-meter"><p>${note}</p><span><i style="width:${pct}%"></i></span></div>` : ""}
        <div class="cart-row"><span>Subtotal</span><b>${money(t.subtotal)}</b></div>
        <div class="cart-row muted"><span>Delivery</span><span>${t.delivery ? money(t.delivery) : "Free"}</span></div>
        <a class="btn btn-primary cart-go" href="checkout.html">Checkout · ${money(t.total)}</a>
        <p class="cart-pay">Pay online by card, or cash on delivery.</p>`;
    }
    if(keep) dlg.querySelector(keep)?.focus();
  }

  body.addEventListener("change", e => { if(e.target.dataset.id) Cart.set(e.target.dataset.id, e.target.value); });
  body.addEventListener("click", e => { const r = e.target.closest("[data-remove]"); if(r) Cart.remove(r.dataset.remove); });
  dlg.addEventListener("click", e => {
    if(e.target === dlg || e.target.closest("[data-cart-close]")) close();
  });
  dlg.addEventListener("close", () => { document.documentElement.classList.remove("cart-open"); opener?.focus?.(); });

  function open(from){
    opener = from || document.activeElement;
    render();
    if(!dlg.open){ dlg.showModal(); document.documentElement.classList.add("cart-open"); }
    dlg.querySelector(".cart-x").focus();
  }
  function close(){ if(dlg.open) dlg.close(); }
  Cart.onChange(render);
  return {open, close};
})();

/* --- Cart buttons in the header show the item count --- */
function syncCartButtons(){
  const n = Cart.count();
  document.querySelectorAll("[data-cart-open]").forEach(b => {
    b.setAttribute("aria-label", `Open cart, ${n} item${n === 1 ? "" : "s"}`);
    const c = b.querySelector(".cart-count");
    if(!c) return;
    c.hidden = n === 0;
    if(c.textContent !== String(n)){ c.textContent = n; c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
  });
}
document.addEventListener("click", e => { const b = e.target.closest("[data-cart-open]"); if(b) CartDrawer.open(b); });
Cart.onChange(syncCartButtons);

/* --- Orders placed in this browser (until a backend stores them) --- */
const Orders = {
  KEY: "skintreat.orders",
  all(){ return store.get(this.KEY, []); },
  get(id){ return this.all().find(o => o.id === id); },
  save(order){ const list = this.all().filter(o => o.id !== order.id); list.unshift(order); store.set(this.KEY, list.slice(0, 20)); }
};

const waLink = msg => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(msg)}`;

renderBuyBoxes();
syncCartButtons();
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
