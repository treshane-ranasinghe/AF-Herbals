/* =====================================================================
   SETTINGS - edit these two things
   1. WHATSAPP_NUMBER: country code + number, no "+", no spaces, no leading 0
      Example for 077 123 4567  ->  "94771234567"
   2. PRODUCTS: name, shelf caption and glow colour for each product.
      Prices are shown in index.html (search "price").
   ===================================================================== */
const WHATSAPP_NUMBER = "94XXXXXXXXX";

const PRODUCTS = {
  pack:   {name:"Whitening Pack",            meta:"Herbal face pack · 100 g · Brighten, glow, even tone", glow:"#B8913A"},
  lotion: {name:"Bright Blast Body Lotion",  meta:"Body lotion · 100 ml · Soft, smooth, radiant",          glow:"#6A45A6"},
  cream:  {name:"Bright Blast Night Cream",  meta:"Brightening night cream · Rs. 2,000",                   glow:"#4B63C9"},
  toner:  {name:"Pure Touch Herbal Toner",   meta:"Hydrating skin-prep toner · 20 ml · Alcohol free",      glow:"#C8336B"},
  oil:    {name:"MagicGrow Herbal Hair Oil", meta:"Herbal hair oil · Roots, scalp, shine",       glow:"#B23A2E"}
};

/* --- Shelf: picking a product changes the page glow --- */
const items = document.querySelectorAll(".shelf-item");
const cap = document.getElementById("caption");
function pick(id){
  items.forEach(b=>{const on=b.dataset.p===id;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
  document.documentElement.style.setProperty("--glow",PRODUCTS[id].glow);
  cap.classList.add("swap");
  setTimeout(()=>{
    document.getElementById("capName").textContent=PRODUCTS[id].name;
    document.getElementById("capMeta").textContent=PRODUCTS[id].meta;
    document.getElementById("capLink").href="#p-"+id;
    cap.classList.remove("swap");
  },220);
}
items.forEach(b=>b.addEventListener("click",()=>pick(b.dataset.p)));

/* --- WhatsApp links: product buttons open a chat with that product named --- */
document.querySelectorAll("[data-wa]").forEach(a=>{
  const card=a.closest(".product");
  const msg=a.dataset.msg || (card ? `Hello AF Herbals, I'd like to order the ${PRODUCTS[card.dataset.id].name}.` : "Hello AF Herbals, I'd like to place an order.");
  a.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
});

document.getElementById("yr").textContent=new Date().getFullYear();

/* --- Motion: reveal sections as they scroll into view --- */
const groups = [".head", ".product", ".set", ".herb", ".promise > div", ".freefrom li", ".order", ".steps li"];
groups.forEach(sel=>document.querySelectorAll(sel).forEach((el,i)=>{
  el.classList.add("reveal");
  el.style.setProperty("--d", (sel===".product" ? 0 : (i%5)*0.1) + "s");
}));
document.querySelectorAll(".steps .n").forEach((n,i)=>n.style.setProperty("--d", (0.3+i*0.25)+"s"));
if("IntersectionObserver" in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }),{threshold:.15,rootMargin:"0px 0px -40px 0px"});
  document.querySelectorAll(".reveal, .steps").forEach(el=>io.observe(el));
}else{
  document.querySelectorAll(".reveal, .steps").forEach(el=>el.classList.add("in"));
}

/* --- Nav gets a soft shadow once the page scrolls --- */
const nav=document.querySelector(".nav");
addEventListener("scroll",()=>nav.classList.toggle("scrolled",scrollY>10),{passive:true});

/* --- Floating WhatsApp button: appears after the hero, hides at the contact card --- */
const fab=document.getElementById("waFab");
const hero=document.querySelector(".hero"), contact=document.getElementById("order");
let pastHero=false, atContact=false;
const showFab=()=>fab.classList.toggle("show",pastHero&&!atContact);
if("IntersectionObserver" in window){
  new IntersectionObserver(([e])=>{pastHero=!e.isIntersecting;showFab()},{threshold:.35}).observe(hero);
  new IntersectionObserver(([e])=>{atContact=e.isIntersecting;showFab()},{threshold:.4}).observe(contact);
}else{ fab.classList.add("show"); }

/* --- Mobile menu --- */
const menuBtn=document.getElementById("menuBtn");
const setMenu=open=>{ nav.classList.toggle("open",open); menuBtn.setAttribute("aria-expanded",open); menuBtn.setAttribute("aria-label",open?"Close menu":"Open menu"); };
menuBtn.addEventListener("click",()=>setMenu(!nav.classList.contains("open")));
document.querySelectorAll("#navList a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
addEventListener("keydown",e=>{ if(e.key==="Escape") setMenu(false); });
