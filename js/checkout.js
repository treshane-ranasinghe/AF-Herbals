/* =====================================================================
   CHECKOUT
   ONLINE PAYMENT runs in "demo" mode until a payment gateway is connected:
   a popup lets you simulate a successful or failed payment, and no card
   is charged. To take real payments with PayHere (Sri Lanka):
     1. Load https://www.payhere.lk/lib/payhere.js on checkout.html.
     2. Send the order to your backend. It saves the order, re-prices it from
        the database, and returns the PayHere payment object with its `hash`
        (the hash needs your merchant secret, so it must never be made here).
     3. Set PAYMENT_MODE to "payhere". payOnline() then opens the PayHere popup.
     4. Treat an order as paid only when PayHere calls your backend's
        notify_url, not because the browser said so.
   ===================================================================== */
const PAYMENT_MODE = "demo";

const DISTRICTS = ["Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha","Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya","Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya"];

(() => {
  const root = document.getElementById("coRoot");
  const saved = store.get("skintreat.customer", {});
  const lock = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const field = (name, label, {type = "text", full = false, optional = false, auto = "", extra = ""} = {}) => `
    <div class="field${full ? " full" : ""}">
      <label for="f-${name}">${label}${optional ? " <small>(optional)</small>" : ""}</label>
      <input id="f-${name}" name="${name}" type="${type}" autocomplete="${auto}" value="${esc(saved[name] || "")}" ${optional ? "" : "required"} ${extra} aria-describedby="e-${name}">
      <span class="err" id="e-${name}"></span>
    </div>`;

  root.innerHTML = `
    <form class="co" id="coForm" novalidate>
      <div>
        <p class="form-alert" id="formAlert" role="alert"></p>
        <section class="co-card">
          <h2><span class="n">1</span>Contact</h2>
          <div class="fields">
            ${field("name", "Full name", {full: true, auto: "name"})}
            ${field("phone", "Mobile number", {type: "tel", auto: "tel", extra: 'inputmode="tel" placeholder="07X XXX XXXX"'})}
            ${field("email", "Email", {type: "email", optional: true, auto: "email", extra: 'placeholder="For your receipt"'})}
          </div>
        </section>

        <section class="co-card">
          <h2><span class="n">2</span>Delivery</h2>
          <div class="fields">
            ${field("address", "Address", {full: true, auto: "street-address", extra: 'placeholder="House no., street"'})}
            ${field("city", "City / town", {auto: "address-level2"})}
            <div class="field">
              <label for="f-district">District</label>
              <select id="f-district" name="district" required aria-describedby="e-district">
                <option value="">Choose district</option>
                ${DISTRICTS.map(d => `<option${saved.district === d ? " selected" : ""}>${d}</option>`).join("")}
              </select>
              <span class="err" id="e-district"></span>
            </div>
            ${field("postcode", "Postal code", {optional: true, auto: "postal-code", extra: 'inputmode="numeric"'})}
            <div class="field full">
              <label for="f-notes">Delivery notes <small>(optional)</small></label>
              <textarea id="f-notes" name="notes" placeholder="Landmark, best time to call…"></textarea>
            </div>
          </div>
        </section>

        <section class="co-card">
          <h2><span class="n">3</span>Payment</h2>
          <fieldset class="pay-opts">
            <legend class="sr-only">Payment method</legend>
            <label class="pay-opt">
              <input type="radio" name="payment" value="online" checked>
              <div><b>Pay online</b><span>Visa, Mastercard, Amex or mobile wallet, secured by PayHere.</span></div>
              <div class="pay-ico" aria-hidden="true"><i>VISA</i><i>MC</i></div>
            </label>
            <label class="pay-opt">
              <input type="radio" name="payment" value="cod">
              <div><b>Cash on delivery</b><span id="codText">Pay the courier in cash when your order arrives.</span></div>
              <div class="pay-ico" aria-hidden="true"><i>LKR</i></div>
            </label>
          </fieldset>
          <p class="pay-info" id="payInfo" aria-live="polite"></p>
        </section>
      </div>

      <aside class="co-card summary" aria-labelledby="sumTitle">
        <h2 id="sumTitle" style="justify-content:space-between">Your order <button type="button" class="edit-cart" data-cart-open>Edit</button></h2>
        <ul class="sum-lines" id="sumLines"></ul>
        <div id="sumRows"></div>
        <button class="btn btn-primary place" id="placeBtn" type="submit">Place order</button>
        <p class="secure">${lock}Your details are only used to deliver this order.</p>
      </aside>
    </form>`;

  const form = document.getElementById("coForm");
  const placeBtn = document.getElementById("placeBtn");
  const alertBox = document.getElementById("formAlert");
  const method = () => form.payment.value;

  /* --- Summary + payment state, re-drawn when the cart or method changes --- */
  let done = false;
  function refresh(){
    if(done) return;
    const lines = Cart.lines();
    if(!lines.length){
      document.getElementById("checkout").innerHTML = `<div class="co-empty"><h1 class="co-title">Your cart is empty</h1><p>Add a product or two, then come back to check out.</p><a class="btn btn-primary" href="index.html#products">Browse products</a></div>`;
      return;
    }
    // Cash on delivery has a ceiling; switch to online if the order goes over it.
    const cod = form.querySelector('input[value="cod"]');
    const overCod = orderTotals(lines, "cod").total > SHOP.codLimit;
    cod.disabled = overCod;
    document.getElementById("codText").textContent = overCod
      ? `Not available for orders over ${money(SHOP.codLimit)}.`
      : `Pay the courier in cash when your order arrives${SHOP.codFee ? ` (+${money(SHOP.codFee)})` : ""}.`;
    if(overCod && cod.checked) form.querySelector('input[value="online"]').checked = true;

    const t = orderTotals(lines, method());
    document.getElementById("sumLines").innerHTML = lines.map(l => `
      <li><span class="sum-pic"><img src="${l.product.image}" alt=""><em>${l.qty}</em></span>
        <span class="nm">${esc(l.product.name)}<small>${esc(l.product.size)} · ${money(l.product.price)} each</small></span>
        <span>${money(l.total)}</span></li>`).join("");
    document.getElementById("sumRows").innerHTML = `
      <div class="sum-row"><span>Subtotal</span><b>${money(t.subtotal)}</b></div>
      <div class="sum-row"><span>Delivery</span><b>${t.delivery ? money(t.delivery) : "Free"}</b></div>
      ${t.codFee ? `<div class="sum-row"><span>Cash on delivery fee</span><b>${money(t.codFee)}</b></div>` : ""}
      <div class="sum-total"><span>Total</span><b>${money(t.total)}</b></div>`;
    document.getElementById("payInfo").textContent = method() === "online"
      ? `You’ll pay ${money(t.total)} in a secure PayHere window. We never see or store your card details.`
      : `Please keep ${money(t.total)} ready in cash. We’ll call to confirm before dispatch.`;
    placeBtn.textContent = method() === "online" ? `Pay ${money(t.total)}` : `Place order · ${money(t.total)}`;
  }
  form.addEventListener("change", e => { if(e.target.name === "payment") refresh(); });
  Cart.onChange(refresh);
  refresh();

  /* --- Validation --- */
  const normPhone = v => {
    const d = v.replace(/[\s\-()]/g, "");
    const m = d.match(/^(?:\+?94|0)(\d{9})$/);
    return m ? "+94" + m[1] : null;
  };
  const rules = {
    name: v => v.trim().length >= 2 || "Please enter your full name.",
    phone: v => !!normPhone(v) || "Enter a Sri Lankan number, e.g. 077 123 4567.",
    email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "That email doesn’t look right.",
    address: v => v.trim().length >= 5 || "Please enter your street address.",
    city: v => v.trim().length >= 2 || "Please enter your city or town.",
    district: v => !!v || "Please choose your district.",
    postcode: v => !v.trim() || /^\d{5}$/.test(v.trim()) || "Postal codes have 5 digits."
  };
  function check(name){
    const el = form.elements[name], res = rules[name](el.value);
    const wrap = el.closest(".field");
    wrap.classList.toggle("invalid", res !== true);
    el.setAttribute("aria-invalid", res !== true);
    document.getElementById("e-" + name).textContent = res === true ? "" : res;
    return res === true;
  }
  form.addEventListener("input", e => { if(rules[e.target.name] && e.target.closest(".invalid")) check(e.target.name); });
  form.addEventListener("focusout", e => { if(rules[e.target.name] && e.target.value) check(e.target.name); });

  const showAlert = msg => { alertBox.textContent = msg; alertBox.classList.toggle("show", !!msg); if(msg) alertBox.scrollIntoView({behavior: "smooth", block: "center"}); };

  /* --- Place order --- */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    showAlert("");
    const bad = Object.keys(rules).filter(n => !check(n));
    if(bad.length){ form.elements[bad[0]].focus(); return; }
    const lines = Cart.lines();
    if(!lines.length) return;

    const f = form.elements, pay = method();
    const order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      customer: {name: f.name.value.trim(), phone: normPhone(f.phone.value), email: f.email.value.trim()},
      delivery: {address: f.address.value.trim(), city: f.city.value.trim(), district: f.district.value, postcode: f.postcode.value.trim(), notes: f.notes.value.trim()},
      items: lines.map(l => ({id: l.id, name: l.product.name, size: l.product.size, price: l.product.price, qty: l.qty, total: l.total})),
      totals: orderTotals(lines, pay),
      payment: {method: pay, status: pay === "cod" ? "due_on_delivery" : "pending"},
      status: "placed"
    };

    placeBtn.disabled = true;
    const label = placeBtn.textContent;
    placeBtn.textContent = pay === "online" ? "Opening secure payment…" : "Placing order…";

    if(pay === "online"){
      const result = await payOnline(order);
      if(result.status !== "paid"){
        placeBtn.disabled = false; placeBtn.textContent = label;
        showAlert(result.status === "dismissed"
          ? "Payment was cancelled. Your cart is saved, so you can try again or choose cash on delivery."
          : "The payment didn’t go through and you were not charged. Please try again, or choose cash on delivery.");
        return;
      }
      order.payment.status = "paid";
      order.payment.reference = result.reference;
    }

    // TODO(backend): POST the order to your API here and use the id it returns.
    Orders.save(order);
    store.set("skintreat.customer", {name: order.customer.name, phone: f.phone.value.trim(), email: order.customer.email,
      address: order.delivery.address, city: order.delivery.city, district: order.delivery.district, postcode: order.delivery.postcode});
    done = true;
    Cart.clear();
    location.href = "order.html?id=" + encodeURIComponent(order.id);
  });

  function newOrderId(){
    const d = new Date(), pad = n => String(n).padStart(2, "0");
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)), b => b.toString(36).padStart(2, "0")).join("").slice(-4).toUpperCase();
    return `ST${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
  }
})();

/* Resolves to {status: "paid" | "dismissed" | "failed", reference?} */
function payOnline(order){
  if(PAYMENT_MODE === "payhere" && window.payhere){
    return new Promise(async resolve => {
      payhere.onCompleted = ref => resolve({status: "paid", reference: ref});
      payhere.onDismissed = () => resolve({status: "dismissed"});
      payhere.onError = () => resolve({status: "failed"});
      // Your backend returns the signed payment object for this order.
      const res = await fetch("/api/payhere/start", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(order)});
      if(!res.ok) return resolve({status: "failed"});
      payhere.startPayment(await res.json());
    });
  }

  // Demo stand-in for the PayHere popup.
  return new Promise(resolve => {
    const dlg = document.createElement("dialog");
    dlg.className = "paybox";
    dlg.setAttribute("aria-labelledby", "payTitle");
    dlg.innerHTML = `<div class="paybox-in">
        <h2 id="payTitle">Secure payment</h2>
        <p>Order ${esc(order.id)}</p>
        <div class="amt">${money(order.totals.total)}</div>
        <p class="demo"><b>Demo mode.</b> No card is charged. Connect PayHere in js/checkout.js to take real payments.</p>
        <div class="btns">
          <button class="btn btn-primary" data-r="paid">Simulate successful payment</button>
          <button class="btn btn-ghost" data-r="failed">Simulate declined card</button>
          <button class="btn btn-ghost" data-r="dismissed">Cancel</button>
        </div>
      </div>`;
    document.body.append(dlg);
    let result = {status: "dismissed"};
    dlg.addEventListener("click", e => {
      const b = e.target.closest("[data-r]");
      if(!b) return;
      result = b.dataset.r === "paid" ? {status: "paid", reference: "DEMO-" + Date.now().toString(36).toUpperCase()} : {status: b.dataset.r};
      dlg.close();
    });
    dlg.addEventListener("close", () => { dlg.remove(); resolve(result); });
    dlg.showModal();
  });
}
