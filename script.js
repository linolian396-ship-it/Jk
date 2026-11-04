/*
  NOVACELL — lógica de catálogo, carrito, inventario y panel admin.
  DEMO: autenticación y datos se guardan en el navegador (localStorage).
  NO es un sistema seguro para producción ni sincroniza entre dispositivos.
*/
const CONFIG = {
  adminUser: "admin",
  // Cambia esta clave para la demostración. En producción usa autenticación en servidor.
  adminPassword: "NovaCell2026!",
  whatsapp: "50588888888",
  storeName: "NovaCell",
  facebook: "https://facebook.com/",
  email: "contacto@novacell.com",
  address: "Escribe aquí tu dirección",
  phoneDisplay: "+505 8888-8888"
};

const starterProducts = [
  {id:"p1",brand:"Apple",model:"iPhone 15",price:32900,oldPrice:35900,stock:5,image:"https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=700",tag:"OFERTA",best:true,featured:true},
  {id:"p2",brand:"Samsung",model:"Galaxy S24",price:28900,oldPrice:0,stock:4,image:"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700",tag:"DESTACADO",best:true,featured:true},
  {id:"p3",brand:"Xiaomi",model:"Redmi Note 13",price:8990,oldPrice:9990,stock:8,image:"https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700",tag:"OFERTA",best:true,featured:false},
  {id:"p4",brand:"Motorola",model:"Moto G84",price:10900,oldPrice:0,stock:3,image:"https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=700",tag:"NUEVO",best:false,featured:true},
  {id:"p5",brand:"Apple",model:"iPhone 14",price:24900,oldPrice:0,stock:2,image:"https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=700",tag:"MÁS VENDIDO",best:true,featured:false},
  {id:"p6",brand:"Samsung",model:"Galaxy A55",price:15900,oldPrice:0,stock:6,image:"https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=700",tag:"NUEVO",best:false,featured:true},
  {id:"p7",brand:"Xiaomi",model:"Redmi Note 13 Pro",price:12900,oldPrice:13900,stock:0,image:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700",tag:"PROMO",best:false,featured:false},
  {id:"p8",brand:"Motorola",model:"Moto G54",price:8490,oldPrice:0,stock:7,image:"https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700",tag:"DESTACADO",best:false,featured:false}
];

const $ = id => document.getElementById(id);
const read = (key, fallback) => { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let products = read("nova_products", starterProducts);
let cart = read("nova_cart", []);
let orders = read("nova_orders", []);
let settings = read("nova_settings", CONFIG);
let isAdmin = false;
const money = n => "C$" + Number(n || 0).toLocaleString("es-NI");
const safe = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const waNumber = () => String(settings.whatsapp || CONFIG.whatsapp).replace(/\D/g,"");

function toast(message) {
  $("toast").textContent = message; $("toast").classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>$("toast").classList.remove("show"),2600);
}
function showModal(id) { $(id).classList.add("show"); $(id).setAttribute("aria-hidden","false"); }
function closeModal(id) { $(id).classList.remove("show"); $(id).setAttribute("aria-hidden","true"); }
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal.show").forEach(m=>closeModal(m.id))});

function persistProducts(){save("nova_products",products)}
function updateContact(){
  document.title = `${settings.storeName || "NovaCell"} | Tu tienda de celulares`;
  document.querySelectorAll(".logo").forEach(el=>{el.innerHTML=`<span class="logo-mark">N</span> ${safe(settings.storeName || "NovaCell")}`});
  $("phoneLink").textContent=settings.phoneDisplay || settings.whatsapp;
  $("phoneLink").href="tel:+"+waNumber();
  $("footerWhatsapp").textContent="WhatsApp: "+(settings.phoneDisplay || settings.whatsapp);
  $("footerWhatsapp").href="https://wa.me/"+waNumber();
  $("facebookLink").href=settings.facebook || "https://facebook.com/";
  $("facebookLink").textContent="Facebook: "+(settings.storeName || "Tienda");
  $("emailLink").href="mailto:"+(settings.email || "");
  $("emailLink").textContent=settings.email || "";
  $("storeAddress").textContent=settings.address || "";
}
function fillBrandOptions(){
  const current=$("brandFilter").value;
  $("brandFilter").innerHTML='<option value="">Todas las marcas</option>';
  [...new Set(products.map(p=>p.brand))].sort().forEach(b=>{const o=document.createElement("option");o.value=b;o.textContent=b;$("brandFilter").appendChild(o)});
  $("brandFilter").value=current;
}
function card(p){
  const sold=p.stock<=0;
  const message=encodeURIComponent(`Hola, me interesa el ${p.brand} ${p.model}. ¿Me pueden confirmar disponibilidad y forma de pago?`);
  return `<article class="product-card"><div class="product-image"><span class="tag">${safe(p.tag||"CELULAR")}</span><img src="${safe(p.image||"")}" alt="${safe(p.brand)} ${safe(p.model)}" loading="lazy" onerror="this.style.display='none'"></div>
  <div class="product-info"><div class="product-brand">${safe(p.brand)}</div><h3>${safe(p.model)}</h3>
  <div class="stock-label ${sold?"out":""}">${sold?"Agotado":`Disponible: ${p.stock} unidad(es)`}</div>
  <div class="price-row"><div><span class="price">${money(p.price)}</span>${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:""}</div>
  <button class="ask-btn" data-add="${safe(p.id)}" ${sold?"disabled":""}>${sold?"Agotado":"Agregar"}</button></div></div></article>`;
}
function renderCatalog(){
  const brand=$("brandFilter").value, query=$("modelFilter").value.trim().toLowerCase();
  let list=products.filter(p=>(!brand||p.brand===brand)&&(`${p.brand} ${p.model}`.toLowerCase().includes(query)));
  if($("sortFilter").value==="low")list.sort((a,b)=>a.price-b.price);
  else if($("sortFilter").value==="high")list.sort((a,b)=>b.price-a.price);
  else list.sort((a,b)=>Number(b.featured)-Number(a.featured));
  $("catalogGrid").innerHTML=list.map(card).join("");
  $("resultCount").textContent=`${list.length} ${list.length===1?"producto":"productos"}`;
  $("emptyState").hidden=list.length>0;
  $("bestGrid").innerHTML=products.filter(p=>p.best).slice(0,4).map(card).join("");
}
$("brandFilter").addEventListener("change",renderCatalog);
$("modelFilter").addEventListener("input",renderCatalog);
$("sortFilter").addEventListener("change",renderCatalog);
$("clearFilters").addEventListener("click",()=>{$("brandFilter").value="";$("modelFilter").value="";$("sortFilter").value="featured";renderCatalog()});

document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");
  if(add){addToCart(add.dataset.add)}
});
function addToCart(id){
  const p=products.find(x=>x.id===id); if(!p||p.stock<=0)return;
  const item=cart.find(x=>x.id===id), qty=item?item.qty:0;
  if(qty>=p.stock){toast("No hay más unidades disponibles.");return}
  if(item)item.qty++;else cart.push({id,qty:1});
  save("nova_cart",cart);renderCart();toast("Producto agregado al carrito.");
}
function cartTotal(){return cart.reduce((sum,item)=>{const p=products.find(x=>x.id===item.id);return sum+(p?p.price*item.qty:0)},0)}
function renderCart(){
  cart=cart.filter(i=>products.some(p=>p.id===i.id));
  $("cartCount").textContent=cart.reduce((s,i)=>s+i.qty,0);
  $("cartItems").innerHTML=cart.length?cart.map(i=>{
    const p=products.find(x=>x.id===i.id);
    return `<div class="cart-line"><div><b>${safe(p.brand)} ${safe(p.model)}</b><small>${money(p.price)} c/u</small></div>
    <div class="qty-controls"><button data-qty="${safe(i.id)}" data-delta="-1">−</button><b>${i.qty}</b><button data-qty="${safe(i.id)}" data-delta="1">+</button></div>
    <button class="remove-item" data-remove="${safe(i.id)}">Quitar</button></div>`;
  }).join(""):'<p class="small-muted">Tu carrito está vacío. Agrega celulares desde el catálogo.</p>';
  $("cartTotal").textContent=money(cartTotal());
  save("nova_cart",cart);
}
$("cartItems").addEventListener("click",e=>{
  const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");
  if(q){const i=cart.find(x=>x.id===q.dataset.qty),p=products.find(x=>x.id===q.dataset.qty);if(!i)return;
    i.qty=Math.max(0,Math.min(p.stock,i.qty+Number(q.dataset.delta)));cart=cart.filter(x=>x.qty>0);renderCart();}
  if(r){cart=cart.filter(x=>x.id!==r.dataset.remove);renderCart();}
});
$("openCart").addEventListener("click",()=>{renderCart();showModal("cartModal")});

$("checkoutForm").addEventListener("submit",e=>{
  e.preventDefault(); if(!cart.length){toast("Agrega productos antes de continuar.");return}
  for(const i of cart){const p=products.find(x=>x.id===i.id);if(!p||p.stock<i.qty){toast("Las existencias cambiaron. Revisa el carrito.");renderCart();return}}
  const data=Object.fromEntries(new FormData(e.currentTarget).entries());
  const lines=cart.map(i=>{const p=products.find(x=>x.id===i.id);return `• ${p.brand} ${p.model} x${i.qty} — ${money(p.price*i.qty)}`});
  const total=cartTotal(), order={id:"NC"+Date.now().toString().slice(-7),date:new Date().toLocaleString("es-NI"),customer:data.customer,phone:data.phone,address:data.address,payment:data.payment,notes:data.notes,items:cart.map(i=>({...i})),total,status:"Pendiente de confirmación"};
  orders.unshift(order);save("nova_orders",orders);
  // Se reservan/restan unidades en esta demostración al generar el pedido.
  cart.forEach(i=>{const p=products.find(x=>x.id===i.id);p.stock-=i.qty});
  persistProducts(); cart=[];save("nova_cart",cart);renderCart();fillBrandOptions();renderCatalog();
  const message=`Hola, quiero realizar este pedido en ${settings.storeName||"NovaCell"}:\nPedido: ${order.id}\n\n${lines.join("\n")}\n\nTotal: ${money(total)}\nNombre: ${data.customer}\nTeléfono: ${data.phone}\nDirección: ${data.address}\nMétodo de pago: ${data.payment}\nNotas: ${data.notes||"Ninguna"}\n\nPor favor confirmen disponibilidad, entrega y datos para pagar.`;
  closeModal("cartModal");e.currentTarget.reset();
  window.open(`https://wa.me/${waNumber()}?text=${encodeURIComponent(message)}`,"_blank","noopener");
  toast("Pedido preparado. Confirma el envío en WhatsApp.");
});

$("openLogin").addEventListener("click",()=>{if(isAdmin){showModal("adminModal")}else{showModal("loginModal")}});
$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());
  if(d.username===CONFIG.adminUser&&d.password===CONFIG.adminPassword){
    isAdmin=true;$("loginError").textContent="";closeModal("loginModal");showModal("adminModal");renderAdmin();toast("Sesión iniciada.");
  }else{$("loginError").textContent="Usuario o contraseña incorrectos."}
});
$("logoutBtn").addEventListener("click",()=>{isAdmin=false;closeModal("adminModal");toast("Sesión cerrada.")});
document.querySelectorAll(".tab-button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(".tab-button").forEach(x=>x.classList.toggle("active",x===b));
  document.querySelectorAll(".tab-panel").forEach(x=>x.hidden=x.id!==b.dataset.tab);
}));
function renderAdmin(){if(!isAdmin)return;renderInventory();renderOrders();populateSettings()}
function renderInventory(){
  $("inventoryBody").innerHTML=products.map(p=>`<tr><td><b>${safe(p.brand)} ${safe(p.model)}</b></td><td>${money(p.price)}</td><td>${p.stock}</td>
  <td><div class="table-actions"><button data-edit="${safe(p.id)}">Editar</button><button class="delete" data-delete="${safe(p.id)}">Eliminar</button></div></td></tr>`).join("");
}
$("inventoryBody").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit){const p=products.find(x=>x.id===edit.dataset.edit),f=$("productForm");Object.entries(p).forEach(([k,v])=>{if(f.elements[k]){if(f.elements[k].type==="checkbox")f.elements[k].checked=!!v;else f.elements[k].value=v}});$("productFormTitle").textContent="Editar producto";$("productsTab").scrollIntoView({block:"nearest"});}
  if(del&&confirm("¿Eliminar este producto del catálogo?")){products=products.filter(p=>p.id!==del.dataset.delete);persistProducts();fillBrandOptions();renderCatalog();renderInventory();resetProductForm();toast("Producto eliminado.");}
});
function resetProductForm(){$("productForm").reset();$("productForm").elements.id.value="";$("productForm").elements.stock.value=1;$("productFormTitle").textContent="Agregar producto"}
$("cancelEdit").addEventListener("click",resetProductForm);
$("productForm").addEventListener("submit",e=>{
  e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f).entries());
  const product={id:d.id||"p"+Date.now(),brand:d.brand.trim(),model:d.model.trim(),price:Number(d.price),oldPrice:Number(d.oldPrice)||0,stock:Number(d.stock),image:d.image.trim(),tag:d.tag,best:f.elements.best.checked,featured:d.tag==="DESTACADO"||d.tag==="NUEVO"};
  if(!product.price||product.price<1||product.stock<0){toast("Revisa el precio y las existencias.");return}
  const index=products.findIndex(p=>p.id===product.id);if(index>=0)products[index]=product;else products.unshift(product);
  persistProducts();fillBrandOptions();renderCatalog();renderInventory();resetProductForm();toast("Producto guardado correctamente.");
});
function renderOrders(){
  $("ordersList").innerHTML=orders.length?orders.slice(0,30).map(o=>`<article class="order-card"><b>${safe(o.id)} · ${safe(o.customer)}</b><br>${safe(o.date)} · ${safe(o.status)}<br>${o.items.map(i=>{const p=products.find(x=>x.id===i.id);return `${safe(p?p.brand+" "+p.model:"Producto")} ×${i.qty}`}).join("<br>")}<br><b>Total: ${money(o.total)}</b><br>Pago: ${safe(o.payment)}<br>Teléfono: ${safe(o.phone)}</article>`).join(""):'<p class="small-muted">Todavía no hay pedidos en este navegador.</p>';
}
function populateSettings(){const f=$("settingsForm");Object.entries(settings).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v??""})}
$("settingsForm").addEventListener("submit",e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());
  settings={...settings,...d,phoneDisplay:d.whatsapp};save("nova_settings",settings);updateContact();toast("Datos de la tienda actualizados.");
});
$("menuToggle").addEventListener("click",()=>$("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
$("year").textContent=new Date().getFullYear();
updateContact();fillBrandOptions();renderCatalog();renderCart();
