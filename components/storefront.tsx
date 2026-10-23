"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Instagram, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, X } from "lucide-react";
import { categories, currency, type CartItem, type Category, type Product, type DeliveryMethod, type Order, type Promotion } from "@/lib/types";
import { demoProducts, demoPromotions } from "@/lib/demo";
import { demoMode, getDemoOrders, getDemoProducts, getDemoPromotions, saveDemoOrders } from "@/lib/demo-storage";
const CART_KEY = "dolce-cart-v1";
const heroImage = "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=1400&auto=format&fit=crop&q=88";
const detailImage = "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&auto=format&fit=crop&q=85";
const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-70px" }, transition: { duration: .55 } };
function ProductCard({ product, onAdd, index }: { product: Product; onAdd: (p: Product) => void; index: number }) {
  return <motion.article {...reveal} transition={{ delay: Math.min(index * .065,.25),duration:.45 }} className="product-card">
    <div className="product-image-wrap">
      <img src={product.image} alt={product.name} loading="lazy" className="product-image" />
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <button type="button" aria-label={"Agregar "+product.name} className="add-float" onClick={() => onAdd(product)} disabled={product.stock === 0}><Plus size={20}/></button>
    </div>
    <div className="product-meta"><span>{product.category}</span><span className="product-price">{currency(product.price)}</span></div>
    <h3>{product.name}</h3><p>{product.description}</p>
    <button className="card-action" type="button" onClick={() => onAdd(product)} disabled={product.stock === 0}>{product.stock === 0 ? "Agotado" : "Agregar al pedido"}<ArrowRight size={16}/></button>
  </motion.article>;
}
export default function Storefront() {
  const [products,setProducts] = useState<Product[]>(demoProducts);
  const [promotions,setPromotions] = useState<Promotion[]>(demoPromotions);
  const [category,setCategory] = useState<string>("Todos");
  const [search,setSearch] = useState("");
  const [cart,setCart] = useState<CartItem[]>([]);
  const [ready,setReady] = useState(false);
  const [cartOpen,setCartOpen] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);
  const [checkout,setCheckout] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState<{id:string,total:number}|null>(null);
  const [delivery,setDelivery] = useState<DeliveryMethod>("Retiro");
  const [customer,setCustomer] = useState({ name:"",phone:"",address:"",requestedDate:"",notes:"" });
  useEffect(() => {
    try { const stored=localStorage.getItem(CART_KEY); if(stored) setCart(JSON.parse(stored) as CartItem[]); } catch {}
    setReady(true);
    if(demoMode) {
      const sync=()=>{setProducts(getDemoProducts().filter(p=>p.active));setPromotions(getDemoPromotions().filter(p=>p.active));};
      sync(); window.addEventListener("dolce-demo-change",sync);
      return ()=>window.removeEventListener("dolce-demo-change",sync);
    }
    fetch("/api/catalog",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("No disponible");return r.json();}).then(d=>{setProducts(d.products);setPromotions(d.promotions||[]);}).catch(()=>setError("No se pudo actualizar el catálogo."));
  },[]);
  useEffect(()=>{ if(ready) localStorage.setItem(CART_KEY,JSON.stringify(cart)); },[cart,ready]);
  const visible = useMemo(()=> products.filter(p => (category==="Todos" || p.category===category) && (p.name+" "+p.description).toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"))),[products,category,search]);
  const count=cart.reduce((sum,item)=>sum+item.quantity,0);
  const subtotal=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  function add(product: Product) {
    setCart(prev=>{
      const exists=prev.find(i=>i.productId===product.id);
      if(exists) return prev.map(i=>i.productId===product.id?{...i,quantity:Math.min(i.quantity+1,product.stock??30,30)}:i);
      return [...prev,{productId:product.id,name:product.name,price:product.price,image:product.image,quantity:1}];
    });
    setCheckout(false);setCartOpen(true);
  }
  function quantity(id:string, delta:number) { setCart(prev=>prev.map(item=>item.productId===id?{...item,quantity:Math.max(0,Math.min(30,item.quantity+delta))}:item).filter(item=>item.quantity>0)); }
  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!cart.length||busy)return;
    setBusy(true);setError("");
    const payload={customer:{name:customer.name.trim(),phone:customer.phone.trim(),address:customer.address.trim(),method:delivery,requestedDate:customer.requestedDate||undefined},notes:customer.notes.trim(),items:cart.map(p=>({productId:p.productId,quantity:p.quantity}))};
    try {
      let receipt: {id:string,total:number};
      if(demoMode) {
        if(payload.customer.name.length<2||payload.customer.phone.length<8||(delivery==="Entrega"&&payload.customer.address.length<8)) throw new Error("Completa los datos de contacto y entrega.");
        receipt={id:"DEMO-"+Math.random().toString(36).slice(2,8).toUpperCase(),total:subtotal};
        const record:Order={id:receipt.id,customer:payload.customer,items:cart.map(({productId,name,price,quantity})=>({productId,name,price,quantity})),subtotal,deliveryFee:0,total:subtotal,notes:payload.notes,status:"Nuevo",createdAt:new Date().toISOString()};
        saveDemoOrders([record,...getDemoOrders()]);
      } else {
        const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        const result=await response.json();
        if(!response.ok) throw new Error(result.error||"No pudimos procesar tu pedido");
        receipt=result.order;
      }
      setSuccess(receipt);setCart([]);setCheckout(false);
    } catch(e) {setError(e instanceof Error?e.message:"Ocurrió un error");}
    finally {setBusy(false);}
  }
  const navigate=()=>setMobileOpen(false);
  return <main className="shop-page">
    <header className="site-header">
      <a className="brand" href="#inicio" onClick={navigate}><span className="brand-mark">✳</span><span>dolce<span className="brand-dot">.</span><small>REPOSTERÍA</small></span></a>
      <nav className={mobileOpen?"nav-links open":"nav-links"} aria-label="Navegación principal">
        <a href="#inicio" onClick={navigate}>Inicio</a><a href="#catalogo" onClick={navigate}>Delicias</a><a href="#promociones" onClick={navigate}>Especiales</a>
      </nav>
      <div className="header-actions"><a href="#catalogo" className="header-order">Explorar menú <ArrowRight size={15}/></a><button className="cart-trigger" type="button" aria-label={"Abrir carrito, "+count+" productos"} onClick={()=>setCartOpen(true)}><ShoppingBag size={20}/>{count>0&&<span className="cart-count">{count}</span>}</button><button className="mobile-menu" type="button" aria-label="Abrir menú" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X size={23}/>:<Menu size={23}/>}</button></div>
    </header>
    <section id="inicio" className="hero">
      <div className="hero-noise"/>
      <div className="hero-left"><motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.6}} className="eyebrow eyebrow-light"><span className="eyebrow-line"/> DOLCE · HECHO CON AMOR</motion.div>
        <motion.h1 initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.12}}>La vida sabe <em>mejor</em><br/>con algo dulce<span className="hero-period">.</span></motion.h1>
        <motion.p initial={{opacity:0,y:22}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.24}} className="hero-sub">Pequeños antojos. Grandes momentos.<br/>Repostería artesanal que enamora.</motion.p>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.3}} className="hero-buttons"><a className="button-primary" href="#catalogo">Elegir mi favorito <ArrowUpIcon/></a><a href="#especial" className="button-text">Descubrir más <ArrowRight size={17}/></a></motion.div>
        <div className="hero-bottom"><span><Star size={15} fill="currentColor"/> Preparado con cariño</span><span className="vertical-line"/><span>Matagalpa, Nicaragua</span></div>
      </div>
      <div className="hero-visual"><motion.div initial={{opacity:0,scale:.92,rotate:3}} animate={{opacity:1,scale:1,rotate:0}} transition={{duration:.9,delay:.14}} className="hero-photo-frame"><img src={heroImage} alt="Pastel artesanal decorado" className="hero-photo"/><div className="hero-photo-overlay"/></motion.div><motion.div initial={{opacity:0,scale:.7}} animate={{opacity:1,scale:1}} transition={{delay:.7}} className="hero-sticker"><span>un poquito<br/>de felicidad</span><Heart size={16} fill="currentColor"/></motion.div><div className="hero-scribble">✦</div><div className="hero-vertical-text">UNA DULCE EXPERIENCIA · EST. MATAGALPA</div></div>
      <div className="hero-scroll"><span>DESLIZA PARA DESCUBRIR</span><ArrowDownRight size={16}/></div>
    </section>
    <section className="strip"><div className="strip-track"><span>Recién hecho</span><span>✳</span><span>Para compartir</span><span>✳</span><span>Momentos especiales</span><span>✳</span><span>Hecho con amor</span><span>✳</span><span>Recién hecho</span><span>✳</span><span>Para compartir</span><span>✳</span></div></section>
    <section id="catalogo" className="catalog section-shell">
      <motion.div {...reveal} className="section-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> DESCUBRE NUESTRO MENÚ</span><h2>Un antojo para <em>cada ocasión.</em></h2></div><p>Elige, combina y pide tus favoritos.</p></motion.div>
      <div className="catalog-controls"><div className="category-scroll" role="group" aria-label="Filtrar por categoría">{categories.map(cat=><button type="button" key={cat} onClick={()=>setCategory(cat)} className={"category-pill "+(category===cat?"selected":"")}>{cat}</button>)}</div><label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="¿Qué se te antoja?" aria-label="Buscar producto"/></label></div>
      {error&&!cartOpen&&<p className="inline-error" role="alert">{error}</p>}
      {visible.length ? <div className="product-grid">{visible.map((product,index)=><ProductCard key={product.id} product={product} onAdd={add} index={index}/>)}</div>:<div className="empty-results"><Sparkles size={30}/><h3>No encontramos ese antojo</h3><p>Prueba con otra categoría o palabra.</p><button onClick={()=>{setSearch("");setCategory("Todos");}}>Ver todos</button></div>}
      <div className="catalog-end"><span>Hechos para compartir, creados para recordar.</span><span>♥</span></div>
    </section>
    <section id="promociones" className="promo-section section-shell">{promotions.length>0&&<><div className="promo-header"><span className="eyebrow"><span className="eyebrow-line"/> ALGO ESPECIAL PARA TI</span><span>Selecciones de temporada ✳</span></div><div className="promo-grid">{promotions.map(promo=><motion.article {...reveal} className="promo-tile" key={promo.id}><img src={promo.image} alt={promo.title} loading="lazy"/><div className="promo-shade"/><div className="promo-tile-copy"><span>{promo.eyebrow}</span><h2>{promo.title}</h2><p>{promo.subtitle}</p><a href="#catalogo">{promo.ctaLabel} <ArrowRight size={17}/></a></div></motion.article>)}</div></>}</section>
    <section id="especial" className="special"><motion.div {...reveal} className="special-image"><img src={detailImage} alt="Selección de postres artesanales" loading="lazy"/><div className="special-seal">DOLCE<br/>♥<br/>MOMENTS</div></motion.div><motion.div {...reveal} className="special-copy"><span className="eyebrow"><span className="eyebrow-line"/> PARA TUS MOMENTOS</span><h2>Hay momentos que merecen <em>algo único.</em></h2><p>Cumpleaños, celebraciones o un simple «porque sí». Cuéntanos tu idea y hagamos que suceda.</p><a href="#catalogo" className="button-dark">Encontrar mi dulce <ArrowRight size={18}/></a><span className="special-decoration">✳</span></motion.div></section>
    <section className="closing-cta"><span className="eyebrow eyebrow-light">EL PLACER DE LO ARTESANAL</span><h2>Endulcemos tu <em>próximo momento.</em></h2><button onClick={()=>setCartOpen(true)} className="button-primary">Ver mi pedido <ShoppingBag size={18}/></button></section>
    <footer className="footer"><div className="footer-top"><a href="#inicio" className="footer-brand">dolce<span>.</span></a><span>Repostería hecha con amor, en Matagalpa.</span><a href="/admin" className="footer-admin">Acceso al equipo <ArrowRight size={14}/></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} DOLCE Repostería</span><span>El ingrediente secreto siempre es el cariño ♥</span></div></footer>
    {demoMode&&<div className="demo-ribbon">Vista de demostración · pedidos de prueba</div>}
    <AnimatePresence>{cartOpen&&<><motion.div className="drawer-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>{setCartOpen(false);setCheckout(false);setError("");}}/><motion.aside className="cart-drawer" initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:28,stiffness:260}} aria-label="Tu pedido"><div className="drawer-header"><div><span className="eyebrow">ALGO DULCE ESTÁ EN CAMINO</span><h2>{success?"¡Listo!":checkout?"Finaliza tu pedido":"Tu cajita dulce"} <span>♥</span></h2></div><button type="button" aria-label="Cerrar" onClick={()=>{setCartOpen(false);setCheckout(false);setSuccess(null);setError("");}}><X size={23}/></button></div>
      {success ? <div className="order-success"><span className="success-icon"><Check size={32}/></span><h3>{demoMode?"Pedido de prueba registrado":"¡Recibimos tu pedido!"}</h3><p>{demoMode?"Puedes verlo en el panel de demostración. No se envió a DOLCE.":"Tu solicitud está registrada. El equipo de DOLCE confirmará los detalles y la entrega."}</p><strong>#{success.id}</strong><p>Total de productos: {currency(success.total)}. El envío, si corresponde, se cotiza por separado.</p><button className="button-dark wide" onClick={()=>{setCartOpen(false);setSuccess(null);}}>Seguir explorando</button></div> :
      checkout ? <form className="checkout-form" onSubmit={submitOrder}><button type="button" className="back-link" onClick={()=>setCheckout(false)}><ArrowLeft size={16}/> Volver a mi carrito</button><div className="field-row"><label>Nombre completo<input required minLength={2} maxLength={100} value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="¿A nombre de quién?"/></label><label>Teléfono / WhatsApp<input required minLength={8} maxLength={22} value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="8888 8888" type="tel"/></label></div><span className="form-label">¿Cómo lo recibirás?</span><div className="delivery-toggle"><button type="button" className={delivery==="Retiro"?"active":""} onClick={()=>setDelivery("Retiro")}>Retirar en tienda</button><button type="button" className={delivery==="Entrega"?"active":""} onClick={()=>setDelivery("Entrega")}>Entrega a domicilio</button></div>{delivery==="Entrega"&&<label>Dirección de entrega<input required minLength={8} maxLength={240} value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})} placeholder="Barrio, dirección y referencia"/></label>}<label>Fecha deseada <span>(opcional)</span><input type="date" min={new Date().toISOString().slice(0,10)} value={customer.requestedDate} onChange={e=>setCustomer({...customer,requestedDate:e.target.value})}/></label><label>Dedicatoria o indicaciones <span>(opcional)</span><textarea rows={3} maxLength={500} value={customer.notes} onChange={e=>setCustomer({...customer,notes:e.target.value})} placeholder="¿Algún detalle especial?"/></label><p className="form-note">{demoMode ? "Esta es una simulación: los datos se guardan solo en este navegador y el pedido NO llega al negocio." : "DOLCE confirmará disponibilidad, fecha y, si aplica, el costo de entrega. No se cobra en línea."}</p>{error&&<div className="form-error" role="alert">{error}</div>}<div className="checkout-bottom"><div className="cart-total"><span>Total de productos</span><strong>{currency(subtotal)}</strong></div><button type="submit" className="button-dark wide" disabled={busy}>{busy?"Registrando...":demoMode?"Registrar pedido de prueba":"Enviar mi pedido"} <ArrowRight size={18}/></button></div></form> :
      <><div className="cart-items">{cart.length?cart.map(item=><div className="cart-item" key={item.productId}><img src={item.image} alt=""/><div className="cart-item-details"><h3>{item.name}</h3><span>{currency(item.price)}</span><div className="qty-controls"><button aria-label="Restar" onClick={()=>quantity(item.productId,-1)}><Minus size={13}/></button><span>{item.quantity}</span><button aria-label="Sumar" onClick={()=>quantity(item.productId,1)}><Plus size={13}/></button></div></div><button className="remove-item" aria-label="Eliminar producto" onClick={()=>setCart(old=>old.filter(i=>i.productId!==item.productId))}><Trash2 size={17}/></button></div>):<div className="cart-empty"><ShoppingBag size={42}/><h3>Tu carrito espera algo delicioso</h3><p>Elige tus favoritos y comienza tu pedido.</p><button className="button-dark" onClick={()=>setCartOpen(false)}>Explorar delicias <ArrowRight size={17}/></button></div>}</div>{cart.length>0&&<div className="cart-footer"><div className="cart-total"><span>Subtotal</span><strong>{currency(subtotal)}</strong></div><p>Entrega sujeta a confirmación. No incluye envío.</p><button className="button-dark wide" onClick={()=>{setCheckout(true);setError("");}}>Continuar pedido <ArrowRight size={18}/></button></div>}</>}
    </motion.aside></>}</AnimatePresence>
  </main>;
}
function ArrowUpIcon(){return <ArrowRight size={18} className="arrow-tilt"/>;}
