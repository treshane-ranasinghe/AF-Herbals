/* =====================================================================
   HOMEPAGE SCRIPT
   Prices, products, delivery and the WhatsApp number are set in js/store.js.
   PRODUCTS below only controls the hero shelf caption and glow colour.
   ===================================================================== */
const PRODUCTS = {
  scrub:   {name:"Coffee Scrub",                meta:"Scrub · Face & body · Coffee",                    glow:"#7A4E32"},
  shampoo: {name:"4 in 1 Strengthening Shampoo", meta:"Shampoo · 300 ml · Rosemary, neem, gotu kola, moringa", glow:"#C8336B"},
  oil:     {name:"Aloe Vera Hair Growth Oil",   meta:"Hair oil · 100 ml · Anti hair fall & hair growth", glow:"#6F9A3A"}
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

/* --- WhatsApp links open a chat with us --- */
document.querySelectorAll("[data-wa]").forEach(a=>{
  a.href=waLink(a.dataset.msg || "Hello Skintreat by AK, I have a question.");
});

document.getElementById("yr").textContent=new Date().getFullYear();

/* --- Motion: reveal sections as they scroll into view --- */
const groups = [".head", ".product", ".spot-copy", ".spot-media", ".ing-photo", ".ing-copy", ".promise > div", ".freefrom li", ".order", ".steps li"];
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
