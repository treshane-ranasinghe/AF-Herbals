/* Order confirmation: order.html?id=ST260928-AB12 */
(() => {
  const root = document.getElementById("order");
  const id = new URLSearchParams(location.search).get("id") || "";
  const o = Orders.get(id);
  const tick = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  if(!o){
    root.innerHTML = `<div class="co-empty"><h1 class="co-title">We couldn’t find that order</h1>
      <p>${id ? `Order ${esc(id)} isn’t saved in this browser.` : "No order number was given."} Message us on WhatsApp and we’ll look it up.</p>
      <div class="ok-actions"><a class="btn btn-primary" href="${waLink(`Hello Skintreat by AK, I'm checking on my order ${id}.`)}" target="_blank" rel="noopener">Chat on WhatsApp</a><a class="btn btn-ghost" href="index.html#products">Continue shopping</a></div></div>`;
    return;
  }

  const cod = o.payment.method === "cod";
  const d = o.delivery;
  const first = o.customer.name.split(" ")[0];
  root.innerHTML = `
    <div class="ok-head">
      <div class="ok-tick">${tick}</div>
      <h1>Thank you, ${esc(first)}!</h1>
      <p>Your order is placed. We’ll call ${esc(o.customer.phone.replace(/^\+94(\d{2})(\d{3})(\d{4})$/, "0$1 $2 $3"))} to confirm before dispatch.</p>
      <span class="ok-id">Order ${esc(o.id)}</span>
    </div>

    <div class="ok-steps">
      <div class="co-card">
        <h3>Payment <span class="status${cod ? " warn" : ""}">${cod ? "Due on delivery" : "Paid"}</span></h3>
        <p>${cod
          ? `Please keep <b>${money(o.totals.total)}</b> in cash ready for the courier.`
          : `We’ve received <b>${money(o.totals.total)}</b> by card.${o.payment.reference ? ` Reference ${esc(o.payment.reference)}.` : ""}`}</p>
      </div>
      <div class="co-card">
        <h3>Delivering to</h3>
        <p>${esc(o.customer.name)}<br>${esc(d.address)}<br>${esc(d.city)}, ${esc(d.district)}${d.postcode ? " " + esc(d.postcode) : ""}</p>
      </div>
    </div>

    <section class="co-card">
      <h2>Order summary</h2>
      <ul class="sum-lines">${o.items.map(i => {
        const img = CATALOG[i.id]?.image;
        return `<li><span class="sum-pic">${img ? `<img src="${img}" alt="">` : ""}<em>${i.qty}</em></span>
          <span class="nm">${esc(i.name)}<small>${esc(i.size)} · ${money(i.price)} each</small></span><span>${money(i.total)}</span></li>`;
      }).join("")}</ul>
      <div class="sum-row"><span>Subtotal</span><b>${money(o.totals.subtotal)}</b></div>
      <div class="sum-row"><span>Delivery</span><b>${o.totals.delivery ? money(o.totals.delivery) : "Free"}</b></div>
      ${o.totals.codFee ? `<div class="sum-row"><span>Cash on delivery fee</span><b>${money(o.totals.codFee)}</b></div>` : ""}
      <div class="sum-total"><span>Total</span><b>${money(o.totals.total)}</b></div>
    </section>

    <div class="ok-actions">
      <a class="btn btn-primary" href="index.html#products">Continue shopping</a>
      <a class="btn btn-ghost" href="${waLink(`Hello Skintreat by AK, I have a question about my order ${o.id}.`)}" target="_blank" rel="noopener">Questions? WhatsApp us</a>
    </div>`;
})();
