"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowDownLeft, ArrowLeft, ArrowRight, BarChart3, CalendarDays, Check, ChevronDown, ClipboardList, Eye, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Search, Settings2, ShoppingBag, Sparkles, TrendingUp, Users, Wallet, X } from "lucide-react";
import { categories, currency, type Category, type Order, type OrderStatus, type Product, type Promotion } from "@/lib/types";
import { db, orderFromFirestore, readableError } from "@/lib/firestore-commerce";
import { productSchema, promotionSchema } from "@/lib/validation";
import { firebaseApp, firebaseAuth, hasFirebaseClient } from "@/lib/firebase-client";
import { collection, doc, getDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
type View = "resumen" | "pedidos" | "productos" | "promociones" | "clientes";
const stateOptions: OrderStatus[] = ["Nuevo","Confirmado","Preparando","Listo","Entregado","Cancelado"];
const emptyPromo: Promotion = {id:"",title:"",subtitle:"",eyebrow:"EDICIÓN ESPECIAL",image:"",ctaLabel:"Ver delicias",active:true};
const emptyProduct: Product = { id:"",name:"",category:"Pasteles",description:"",price:0,image:"",stock:null,active:true,featured:false,badge:"" };
const tabs: {id:View;label:string;icon:typeof LayoutDashboard}[] = [
  {id:"resumen",label:"Resumen",icon:LayoutDashboard},
  {id:"pedidos",label:"Pedidos",icon:ClipboardList},
  {id:"productos",label:"Productos",icon:Package},
  {id:"promociones",label:"Promociones",icon:Sparkles},
  {id:"clientes",label:"Clientes",icon:Users},
];
const dateFormat=(date:string)=>{try{return new Date(date).toLocaleDateString("es-NI",{day:"numeric",month:"short"});}catch{return date;}};
const statusClass=(status: OrderStatus)=>"status status-"+status.toLowerCase();
export default function AdminDashboard() {
  const [view,setView]=useState<View>("resumen");
  const [orders,setOrders]=useState<Order[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [promotions,setPromotions]=useState<Promotion[]>([]);
  const [authenticated,setAuthenticated]=useState(false);
  const [account,setAccount]=useState<{email:string;uid:string;isAnonymous:boolean}|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [connection,setConnection]=useState<"idle"|"checking"|"connected"|"failed">("idle");
  const [search,setSearch]=useState("");
  const [sideOpen,setSideOpen]=useState(false);
  const [editing,setEditing]=useState<Product|null>(null);
  const [editingPromo,setEditingPromo]=useState<Promotion|null>(null);
  const [newPromo,setNewPromo]=useState(false);
  const [isNew,setIsNew]=useState(false);
  const [detail,setDetail]=useState<Order|null>(null);
  const [userName,setUserName]=useState("Equipo DOLCE");
  const refresh=useCallback(async()=>{
    const user=firebaseAuth().currentUser;
    if(!user){setAuthenticated(false);return;}
    try{
      const staff=await getDoc(doc(db(),"staff",user.uid));
      if(!staff.exists() || !["owner","admin"].includes(staff.data().role)){
        throw new Error("Google reconoció tu cuenta, pero no encontramos un permiso administrativo activo. Verifica en el proyecto dolce-reposteria el documento staff/"+user.uid+" y el campo role (texto): owner.");
      }
      const [o,p,promos]=await Promise.all([
        getDocs(query(collection(db(),"orders"),orderBy("createdAt","desc"),limit(150))),
        getDocs(query(collection(db(),"products"),limit(150))),
        getDocs(query(collection(db(),"promotions"),limit(50))),
      ]);
      if(firebaseAuth().currentUser?.uid!==user.uid)return;
      setOrders(o.docs.map(s=>orderFromFirestore(s.id,s.data())));
      setProducts(p.docs.map(s=>({...s.data(),id:s.id} as Product)));
      setPromotions(promos.docs.map(s=>({...s.data(),id:s.id} as Promotion)));
      setAuthenticated(true);setError("");
    }catch(e){if(firebaseAuth().currentUser?.uid!==user.uid)return;setError(readableError(e));setAuthenticated(false);}
  },[]);
  useEffect(()=>{
    if(!hasFirebaseClient){setLoading(false);setError("Firebase todavía no está configurado.");return;}
    const unsub=onAuthStateChanged(firebaseAuth(),async user=>{
      setUserName(user?.displayName||"Equipo DOLCE");
      setAccount(user?{email:user.email||"",uid:user.uid,isAnonymous:user.isAnonymous}:null);
      if(user && !user.isAnonymous)await refresh();
      else {setAuthenticated(false);setError("");}
      setLoading(false);
    });
    return()=>unsub();
  },[refresh]);
  // Live subscriptions, common source for the store and management console.
  useEffect(()=>{
    if(!authenticated)return;
    const unsubOrders=onSnapshot(query(collection(db(),"orders"),orderBy("createdAt","desc"),limit(150)),
      snap=>setOrders(snap.docs.map(s=>orderFromFirestore(s.id,s.data()))),
      e=>setError(readableError(e)));
    const unsubProducts=onSnapshot(query(collection(db(),"products"),limit(150)),
      snap=>setProducts(snap.docs.map(s=>({...s.data(),id:s.id} as Product))),
      e=>setError(readableError(e)));
    const unsubPromos=onSnapshot(query(collection(db(),"promotions"),limit(50)),
      snap=>setPromotions(snap.docs.map(s=>({...s.data(),id:s.id} as Promotion))),
      e=>setError(readableError(e)));
    return()=>{unsubOrders();unsubProducts();unsubPromos();};
  },[authenticated]);
  async function testConnection(){
    setConnection("checking");
    try{await getDocs(query(collection(db(),"products"),where("active","==",true),limit(1)));setConnection("connected");}
    catch{setConnection("failed");}
  }
  async function login(){
    setLoading(true);setError("");
    try{await signInWithPopup(firebaseAuth(),new GoogleAuthProvider());await refresh();}
    catch(e){setError(readableError(e));}
    finally{setLoading(false);}
  }
  async function recheckAccess(){setLoading(true);try{await refresh();}finally{setLoading(false);}}
  async function switchAccount(){setLoading(true);setError("");try{await signOut(firebaseAuth());}catch(e){setError(readableError(e));}finally{setLoading(false);}}
  async function changeStatus(order:Order,status:OrderStatus){
    setSaving(true);setError("");
    try{
      await updateDoc(doc(db(),"orders",order.id),{status,updatedAt:serverTimestamp()});
      setDetail(current=>current?.id===order.id?{...current,status}:current);
    }catch(e){setError(readableError(e));}
    finally{setSaving(false);}
  }
  async function saveProduct(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editing)return;
    setError("");setSaving(true);
    const candidate={...editing,id:editing.id.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
      name:editing.name.trim(),image:editing.image.trim(),price:Number(editing.price),
      stock:editing.stock===null?null:Number(editing.stock),featured:Boolean(editing.featured),badge:editing.badge||""};
    const parsed=productSchema.safeParse(candidate);
    if(!parsed.success){setError(parsed.error.issues[0]?.message||"Revisa los campos del producto.");setSaving(false);return;}
    try{
      const {id,...product}=parsed.data;
      await setDoc(doc(db(),"products",id),{...product,updatedAt:serverTimestamp()},{merge:true});
      setEditing(null);setIsNew(false);
    }catch(e){setError(readableError(e));}
    finally{setSaving(false);}
  }
  async function toggleProduct(product:Product){
    setError("");
    try{await updateDoc(doc(db(),"products",product.id),{active:!product.active,updatedAt:serverTimestamp()});}
    catch(e){setError(readableError(e));}
  }
  async function savePromotion(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editingPromo)return;
    setSaving(true);setError("");
    const candidate={...editingPromo,id:editingPromo.id.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")};
    const parsed=promotionSchema.safeParse(candidate);
    if(!parsed.success){setError(parsed.error.issues[0]?.message||"Revisa los campos de la promoción.");setSaving(false);return;}
    try{
      const {id,...promotion}=parsed.data;
      await setDoc(doc(db(),"promotions",id),{...promotion,updatedAt:serverTimestamp()},{merge:true});
      setEditingPromo(null);
    }catch(e){setError(readableError(e));}
    finally{setSaving(false);}
  }
  async function togglePromotion(promotion:Promotion){
    setError("");
    try{await updateDoc(doc(db(),"promotions",promotion.id),{active:!promotion.active,updatedAt:serverTimestamp()});}
    catch(e){setError(readableError(e));}
  }
  const validOrders=orders.filter(o=>o.status!=="Cancelado");
  const revenue=validOrders.filter(o=>o.status==="Entregado").reduce((sum,o)=>sum+o.total,0);
  const pending=orders.filter(o=>!["Entregado","Cancelado"].includes(o.status)).length;
  const newOrders=orders.filter(o=>o.status==="Nuevo").length;
  const customers=Array.from(new Map(orders.map(o=>[o.customer.phone,o.customer])).values());
  const chartData=useMemo(()=>{
    const days=Array.from({length:7},(_,i)=>{const day=new Date();day.setHours(0,0,0,0);day.setDate(day.getDate()-(6-i));return day;});
    return days.map(day=>({day:day.toLocaleDateString("es-NI",{weekday:"short"}),ventas:orders.filter(o=>o.status!=="Cancelado"&&new Date(o.createdAt).toDateString()===day.toDateString()).reduce((sum,o)=>sum+o.total,0)}));
  },[orders]);
  const displayedOrders=orders.filter(o=>(o.customer.name+" "+o.id+" "+o.customer.phone).toLowerCase().includes(search.toLowerCase()));
  const displayedProducts=products.filter(p=>(p.name+" "+p.category).toLowerCase().includes(search.toLowerCase()));
  function navigate(next:View){setView(next);setSearch("");setSideOpen(false);}
  if(loading)return <div className="admin-center"><div className="spinner"/>Cargando DOLCE Manager...</div>;
  if(!authenticated)return <div className="login-page"><a href="/" className="login-back"><ArrowLeft size={17}/> Volver a la tienda</a><div className="login-card"><span className="login-symbol">✳</span><span className="eyebrow">DOLCE REPOSTERÍA</span><h1>Tu espacio de <em>creación.</em></h1><p>Gestiona pedidos, productos y todo lo que hace especial a DOLCE.</p>{error&&<div className="form-error" role="alert">{error}</div>}{account&&!account.isAnonymous&&<div className="login-recovery"><strong>Cuenta identificada</strong><span>{account.email||"Cuenta de Google"}</span><small>UID de Firebase</small><code>{account.uid}</code><a href="/admin/acceso">Ver los pasos para recuperar el acceso <ArrowRight size={15}/></a><button type="button" onClick={()=>void switchAccount()}>Usar otra cuenta de Google</button></div>}<button className="button-dark wide" onClick={()=>void (account&&!account.isAnonymous?recheckAccess():login())}>{account&&!account.isAnonymous?"Comprobar acceso de nuevo":"Continuar con Google"} <ArrowRight size={18}/></button><small>Acceso exclusivo para personal autorizado.</small></div></div>;
  return <div className="admin-app">
    {sideOpen&&<button className="sidebar-overlay" aria-label="Cerrar menú" onClick={()=>setSideOpen(false)}/>}
    <aside className={"admin-sidebar "+(sideOpen?"open":"")}><div className="admin-sidebar-top"><a href="/" className="admin-logo">dolce<span>.</span><small>MANAGER</small></a><span className="workspace-label">ESPACIO DE TRABAJO</span><nav className="admin-nav" aria-label="Administración">{tabs.map(item=>{const Icon=item.icon;return <button key={item.id} className={view===item.id?"active":""} onClick={()=>navigate(item.id)}><Icon size={19}/>{item.label}{item.id==="pedidos"&&newOrders>0&&<span className="nav-count">{newOrders}</span>}</button>;})}</nav></div><div className="admin-sidebar-bottom"><div className="sidebar-tip"><Sparkles size={19}/><strong>Tu negocio, más cerca.</strong><p>Todo lo que necesitas en un solo lugar.</p></div><a className="sidebar-store" href="/" target="_blank" rel="noreferrer"><ShoppingBag size={18}/> Ver tienda <ArrowRight size={16}/></a>{<button className="sidebar-logout" onClick={()=>signOut(firebaseAuth())}><LogOut size={16}/> Cerrar sesión</button>}</div></aside>
    <div className="admin-main"><header className="admin-topbar"><button className="admin-mobile-menu" aria-label="Menú" onClick={()=>setSideOpen(true)}><Menu size={23}/></button><div className="admin-breadcrumb">DOLCE <span>/</span> {tabs.find(t=>t.id===view)?.label}</div><div className="topbar-right"><span className="online-dot"/> <span className="user-name">{userName}</span><span className="avatar">D</span></div></header>
      <div className="admin-content">
      {error&&<div className="admin-error" role="alert">{error}<button onClick={()=>setError("")}><X size={17}/></button></div>}
      {view==="resumen"&&<><div className="admin-page-title"><div><span className="eyebrow">CENTRO DE CONTROL</span><h1>Un gran día comienza <em>aquí.</em></h1><p>Esto es lo que está pasando en tu negocio.</p></div><span className="today-tag"><CalendarDays size={16}/>{new Date().toLocaleDateString("es-NI",{day:"numeric",month:"long",year:"numeric"})}</span></div>
        <div className="kpi-grid"><div className="kpi-card"><span>Ventas completadas <Wallet size={20}/></span><strong>{currency(revenue)}</strong><small>Pedidos entregados registrados</small></div><div className="kpi-card"><span>Pedidos en proceso <ClipboardList size={20}/></span><strong>{pending}</strong><small>{newOrders} nuevos por confirmar</small></div><div className="kpi-card"><span>Clientes <Users size={20}/></span><strong>{customers.length}</strong><small>Con pedidos registrados</small></div><div className="kpi-card"><span>Productos activos <Package size={20}/></span><strong>{products.filter(p=>p.active).length}</strong><small>Disponibles en el catálogo</small></div></div>
        <div className="admin-overview-grid"><section className="admin-panel chart-panel"><div className="panel-header"><div><span className="eyebrow">PULSO COMERCIAL</span><h2>Pedidos de la semana</h2></div><span className="panel-chip"><TrendingUp size={15}/> Últimos 7 días</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:18,right:10,left:10,bottom:0}}><defs><linearGradient id="sales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bc677e" stopOpacity={.28}/><stop offset="100%" stopColor="#bc677e" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#efe8e3" vertical={false}/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fill:"#8f8482",fontSize:12}}/><Tooltip formatter={(v)=>currency(Number(v))} contentStyle={{borderRadius:14,border:"1px solid #f0e5e0"}}/><Area type="monotone" dataKey="ventas" stroke="#9d4565" strokeWidth={3} fill="url(#sales)"/></AreaChart></ResponsiveContainer></div></section><section className="admin-panel attention-panel"><div className="panel-header"><div><span className="eyebrow">A LA VISTA</span><h2>Por atender</h2></div><span className="attention-icon">✳</span></div><strong className="attention-number">{pending.toString().padStart(2,"0")}</strong><p>pedidos necesitan seguimiento</p><button className="button-dark wide" onClick={()=>navigate("pedidos")}>Gestionar pedidos <ArrowRight size={17}/></button></section></div>
        <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">MOVIMIENTO RECIENTE</span><h2>Últimos pedidos</h2></div><button className="text-link" onClick={()=>navigate("pedidos")}>Ver todos <ArrowRight size={16}/></button></div><OrderTable orders={orders.slice(0,5)} onSelect={setDetail}/></section></>}
      {view==="pedidos"&&<><div className="admin-page-title"><div><span className="eyebrow">OPERACIÓN DIARIA</span><h1>Gestión de <em>pedidos.</em></h1><p>Del primer antojo hasta la entrega.</p></div><span className="today-tag">{orders.length} pedidos</span></div><div className="admin-panel"><div className="list-toolbar"><label className="admin-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pedido o cliente" /></label><button className="toolbar-refresh" onClick={()=>void refresh()}>Actualizar <ArrowRight size={16}/></button></div><OrderTable orders={displayedOrders} onSelect={setDetail}/></div></>}
      {view==="productos"&&<><div className="admin-page-title"><div><span className="eyebrow">TU VITRINA DIGITAL</span><h1>Productos con <em>personalidad.</em></h1><p>Tu catálogo, siempre al día.</p></div><button className="button-dark" onClick={()=>{setEditing({...emptyProduct});setIsNew(true);setError("");}}><Plus size={17}/> Nuevo producto</button></div><div className="admin-panel"><div className="list-toolbar"><label className="admin-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar producto" /></label><span className="list-counter">{products.length} productos</span></div><div className="admin-products">{displayedProducts.map(p=><div className="admin-product" key={p.id}><img src={p.image} alt={p.name}/><div className="admin-product-name"><strong>{p.name}</strong><span>{p.category}</span></div><span className="admin-product-price">{currency(p.price)}</span><span className={"stock-badge "+(p.stock===0?"out":"")}>{p.stock===null?"Sin límite":p.stock+" unidades"}</span><button className={"visibility-toggle "+(p.active?"on":"")} onClick={()=>void toggleProduct(p)} aria-label={p.active?"Ocultar producto":"Mostrar producto"} title={p.active?"Visible":"Oculto"}><span/></button><button className="icon-button" onClick={()=>{setEditing({...p});setIsNew(false);setError("");}} aria-label={"Editar "+p.name}><Pencil size={17}/></button></div>)}{displayedProducts.length===0&&<p className="admin-empty">No hay productos para mostrar.</p>}</div></div></>}
      {view==="promociones"&&<><div className="admin-page-title"><div><span className="eyebrow">CAMPAÑAS Y DESTACADOS</span><h1>Promociones que <em>conectan.</em></h1><p>Gestiona los destacados visibles en la tienda.</p></div><button className="button-dark" onClick={()=>{setEditingPromo({...emptyPromo});setNewPromo(true);setError("");}}><Plus size={17}/> Nueva promoción</button></div><div className="admin-panel"><div className="promo-admin-grid">{promotions.map(p=><article className="promo-admin-card" key={p.id}><img src={p.image} alt={p.title}/><div><span className="eyebrow">{p.eyebrow}</span><h3>{p.title}</h3><p>{p.subtitle}</p><div className="promo-admin-actions"><span className={"status "+(p.active?"status-entregado":"status-cancelado")}>{p.active?"Visible":"Oculta"}</span><button onClick={()=>void togglePromotion(p)}>{p.active?"Ocultar":"Publicar"}</button><button onClick={()=>{setEditingPromo({...p});setNewPromo(false);setError("");}}><Pencil size={15}/> Editar</button></div></div></article>)}{promotions.length===0&&<div className="admin-empty">Crea tu primera campaña para mostrarla en la tienda.</div>}</div></div></>}
      {view==="clientes"&&<><div className="admin-page-title"><div><span className="eyebrow">COMUNIDAD DOLCE</span><h1>Personas que nos <em>eligen.</em></h1><p>Conoce a tus clientes y sus pedidos.</p></div><span className="today-tag">{customers.length} clientes</span></div><div className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>Teléfono</th><th>Pedidos</th><th>Compras registradas</th></tr></thead><tbody>{customers.map(customer=>{const customerOrders=orders.filter(o=>o.customer.phone===customer.phone);return <tr key={customer.phone}><td><strong>{customer.name}</strong></td><td>{customer.phone}</td><td>{customerOrders.length}</td><td>{currency(customerOrders.filter(o=>o.status!=="Cancelado").reduce((sum,o)=>sum+o.total,0))}</td></tr>;})}</tbody></table>{customers.length===0&&<div className="admin-empty">Todavía no hay clientes registrados.</div>}</div></div></>}
      </div></div>
    {detail&&<div className="admin-modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setDetail(null);}}><div className="admin-modal order-modal"><div className="modal-title"><div><span className="eyebrow">DETALLES DEL PEDIDO</span><h2>Pedido #{detail.id.slice(0,12)}</h2></div><button onClick={()=>setDetail(null)} aria-label="Cerrar"><X size={22}/></button></div><div className="order-detail-fields"><div><small>Cliente</small><strong>{detail.customer.name}</strong></div><div><small>Contacto</small><strong>{detail.customer.phone}</strong></div><div><small>Entrega</small><strong>{detail.customer.method}</strong></div><div><small>Fecha solicitada</small><strong>{detail.customer.requestedDate||"Por confirmar"}</strong></div></div>{detail.customer.address&&<p className="detail-note"><strong>Dirección:</strong> {detail.customer.address}</p>}<div className="detail-lines">{detail.items.map(item=><div key={item.productId}><span>{item.quantity} × {item.name}</span><strong>{currency(item.quantity*item.price)}</strong></div>)}<div className="detail-total"><span>Total productos</span><strong>{currency(detail.total)}</strong></div></div>{detail.notes&&<p className="detail-note"><strong>Indicaciones:</strong> {detail.notes}</p>}<label className="status-picker">Estado actual<select value={detail.status} onChange={e=>void changeStatus(detail,e.target.value as OrderStatus)} disabled={saving}>{stateOptions.map(s=><option key={s}>{s}</option>)}</select></label><small className="modal-caption">El cambio se guarda inmediatamente.</small></div></div>}
    {editing&&<div className="admin-modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null);}}><form className="admin-modal product-modal" onSubmit={saveProduct}><div className="modal-title"><div><span className="eyebrow">CATÁLOGO DOLCE</span><h2>{isNew?"Nuevo producto":"Editar producto"}</h2></div><button type="button" onClick={()=>{setEditing(null);setError("");}} aria-label="Cerrar"><X size={22}/></button></div><div className="product-form-grid"><label>Identificador<input required disabled={!isNew} value={editing.id} onChange={e=>setEditing({...editing,id:e.target.value})} placeholder="pastel-de-fresa"/></label><label>Nombre<input required value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Pastel de fresas"/></label><label>Categoría<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value as Category})}>{categories.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}</select></label><label>Precio (C$)<input required type="number" min="1" max="100000" value={editing.price||""} onChange={e=>setEditing({...editing,price:Number(e.target.value)})}/></label><label>Inventario <span>(vacío = sin límite)</span><input type="number" min="0" value={editing.stock??""} onChange={e=>setEditing({...editing,stock:e.target.value===""?null:Number(e.target.value)})}/></label><label>Etiqueta <span>(opcional)</span><input maxLength={30} value={editing.badge||""} onChange={e=>setEditing({...editing,badge:e.target.value})} placeholder="Favorito"/></label><label className="feature-product-toggle"><input type="checkbox" checked={Boolean(editing.featured)} onChange={e=>setEditing({...editing,featured:e.target.checked})}/><span>Mostrar en el carrusel del hero</span></label><label className="full-field">URL de fotografía (HTTPS)<input required type="url" value={editing.image} onChange={e=>setEditing({...editing,image:e.target.value})} placeholder="https://..."/></label><label className="full-field">Descripción<textarea maxLength={400} rows={3} value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label></div>{editing.image.startsWith("https://")&&<img src={editing.image} className="preview-product" alt="Vista previa"/>}{error&&<div className="form-error">{error}</div>}<button className="button-dark wide" type="submit" disabled={saving}>{saving?"Guardando...":"Guardar producto"} <Check size={17}/></button></form></div>}
{editingPromo&&<div className="admin-modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setEditingPromo(null);}}><form className="admin-modal product-modal" onSubmit={savePromotion}><div className="modal-title"><div><span className="eyebrow">CAMPAÑA DOLCE</span><h2>{newPromo?"Nueva promoción":"Editar promoción"}</h2></div><button type="button" onClick={()=>{setEditingPromo(null);setError("");}} aria-label="Cerrar"><X size={22}/></button></div><div className="product-form-grid"><label>Identificador<input required disabled={!newPromo} value={editingPromo.id} onChange={e=>setEditingPromo({...editingPromo,id:e.target.value})} placeholder="temporada-dulce"/></label><label>Etiqueta<input required maxLength={40} value={editingPromo.eyebrow} onChange={e=>setEditingPromo({...editingPromo,eyebrow:e.target.value})}/></label><label className="full-field">Título<input required maxLength={100} value={editingPromo.title} onChange={e=>setEditingPromo({...editingPromo,title:e.target.value})}/></label><label className="full-field">Descripción<textarea maxLength={240} rows={2} value={editingPromo.subtitle} onChange={e=>setEditingPromo({...editingPromo,subtitle:e.target.value})}/></label><label className="full-field">Imagen HTTPS<input required type="url" value={editingPromo.image} onChange={e=>setEditingPromo({...editingPromo,image:e.target.value})}/></label><label className="full-field">Texto del botón<input required maxLength={40} value={editingPromo.ctaLabel} onChange={e=>setEditingPromo({...editingPromo,ctaLabel:e.target.value})}/></label></div>{error&&<div className="form-error">{error}</div>}<button type="submit" className="button-dark wide" disabled={saving}>{saving?"Guardando...":"Guardar promoción"} <Check size={17}/></button></form></div>}
      </div>;
}
function OrderTable({orders,onSelect}:{orders:Order[];onSelect:(order:Order)=>void}) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th/></tr></thead><tbody>{orders.map(order=><tr key={order.id}><td><strong>#{order.id.slice(0,12)}</strong></td><td><strong>{order.customer.name}</strong><small>{order.customer.method}</small></td><td>{dateFormat(order.createdAt)}</td><td><strong>{currency(order.total)}</strong></td><td><span className={statusClass(order.status)}>{order.status}</span></td><td><button onClick={()=>onSelect(order)} className="table-view" aria-label={"Ver pedido "+order.id}><Eye size={17}/></button></td></tr>)}</tbody></table>{orders.length===0&&<div className="admin-empty">No hay pedidos todavía.</div>}</div>;
}
