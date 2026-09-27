/* =====================================================================
   SETTINGS - edit these two things
   1. WHATSAPP_NUMBER: country code + number, no "+", no spaces, no leading 0
      Example for 077 123 4567  ->  "94771234567"
   2. PRODUCTS: name, shelf caption and glow colour for each product.
      Prices are shown in index.html (search "price").
   ===================================================================== */
const WHATSAPP_NUMBER = "94XXXXXXXXX";

const PRODUCTS = {
  glow:  {name:"Natural Glow Face Pack Powder", meta:"Face pack powder · 50 g · Clears pores & brightens",   glow:"#B8913A"},
  oil:   {name:"Kumkumadi Face Oil",            meta:"Ayurvedic skin elixir · 30 ml · Radiance, repair",     glow:"#C9782E"},
  scrub: {name:"Coffee-Coconut Body Scrub",     meta:"Body scrub · 200 g · Coffee & coconut",               glow:"#7A4E32"}
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
  const msg=a.dataset.msg || (card ? `Hello Vedas by Kashi, I'd like to order the ${PRODUCTS[card.dataset.id].name}.` : "Hello Vedas by Kashi, I'd like to place an order.");
  a.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
});

document.getElementById("yr").textContent=new Date().getFullYear();

/* --- Motion: reveal sections as they scroll into view --- */
const groups = [".head", ".product", ".spot-copy", ".spot-media", ".film-media", ".film-copy", ".ing-photo", ".ing-copy", ".promise > div", ".freefrom li", ".order", ".steps li"];
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

/* --- Videos: play muted while on screen, pause when scrolled away; sound button toggles audio --- */
const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll(".vframe").forEach(frame=>{
  const v=frame.querySelector("video"), b=frame.querySelector(".snd");
  if(calm){ v.controls=true; }
  else if("IntersectionObserver" in window){
    new IntersectionObserver(([e])=>{ e.isIntersecting ? v.play().catch(()=>{}) : v.pause(); },{threshold:.35}).observe(v);
  }
  b.addEventListener("click",()=>{
    const on=v.muted;
    document.querySelectorAll(".vframe video").forEach(o=>{ if(o!==v){ o.muted=true; } });
    document.querySelectorAll(".snd").forEach(o=>{ if(o!==b){ o.setAttribute("aria-pressed","false"); o.setAttribute("aria-label","Turn sound on"); } });
    v.muted=!on; if(on) v.play().catch(()=>{});
    b.setAttribute("aria-pressed",on); b.setAttribute("aria-label",on?"Turn sound off":"Turn sound on");
  });
});
