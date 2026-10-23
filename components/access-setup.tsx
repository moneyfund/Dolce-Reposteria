"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { firebaseAuth, hasFirebaseClient } from "@/lib/firebase-client";
export default function AccessSetup(){
  const [user,setUser]=useState<User|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  useEffect(()=>{
    if(!hasFirebaseClient)return;
    const unsubscribe=onAuthStateChanged(firebaseAuth(),setUser);
    return()=>unsubscribe();
  },[]);
  async function signIn(){
    setBusy(true);setError("");
    try{await signInWithPopup(firebaseAuth(),new GoogleAuthProvider());}
    catch(e){
      const message=e instanceof Error?e.message:"Error de autenticación";
      setError(message.includes("auth/unauthorized-domain")?"Agrega el dominio de Vercel a los dominios autorizados en Firebase Authentication.":message.includes("auth/operation-not-allowed")?"Habilita el proveedor Google en Firebase Authentication.":"No se pudo iniciar sesión con Google. Comprueba la configuración de Firebase.");
    }finally{setBusy(false);}
  }
  async function copyUid(){if(!user)return;try{await navigator.clipboard.writeText(user.uid);setCopied(true);}catch{setError("Selecciona y copia el UID manualmente.");}}
  return <main className="access-setup"><a className="access-return" href="/admin"><ArrowLeft size={17}/> Volver al Manager</a><section className="access-card"><div className="access-icon"><KeyRound size={26}/></div><span className="eyebrow">FIREBASE · CONFIGURACIÓN INICIAL</span><h1>Acceso del <em>propietario.</em></h1><p>Identifica tu cuenta de Google de forma segura antes de habilitar los pedidos reales de DOLCE.</p>
    {!hasFirebaseClient?<div className="form-error">La configuración pública de Firebase todavía no está disponible en este despliegue.</div>:user?<><div className="access-identity"><strong>{user.displayName||"Cuenta de Google"}</strong><small>{user.email}</small></div><span className="access-field-label">Tu UID de Firebase</span><div className="uid-copy"><code>{user.uid}</code><button type="button" onClick={()=>void copyUid()} aria-label="Copiar UID">{copied?<Check size={18}/>:<Copy size={18}/>}</button></div><div className="access-instructions"><ShieldCheck size={20}/><p>En la consola de Firestore crea manualmente el documento <code>staff/{user.uid}</code> con el campo <code>role</code> de tipo texto y valor <code>owner</code>. Solo una persona con acceso administrativo a Firebase puede hacerlo.</p></div><button className="access-logout" onClick={()=>void signOut(firebaseAuth())}><LogOut size={15}/> Cerrar sesión</button></>:<button className="button-dark wide" onClick={()=>void signIn()} disabled={busy}>{busy?"Iniciando...":"Identificarme con Google"} <ArrowRight size={17}/></button>}
    {error&&<div className="form-error" role="alert">{error}</div>}<p className="access-disclaimer">Esta pantalla no habilita acceso al panel ni permite modificar la base de datos. Únicamente muestra el UID de la cuenta autenticada.</p>
  </section></main>;
}
