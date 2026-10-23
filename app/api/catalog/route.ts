import { NextResponse } from "next/server";
import { demoProducts } from "@/lib/demo";
import { getBackend } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";
export async function GET() {
  const backend = getBackend();
  if (!backend) return NextResponse.json({ mode: "demo", products: demoProducts }, { headers: { "Cache-Control": "no-store" } });
  try {
    const snapshot = await backend.db.collection("products").where("active", "==", true).limit(100).get();
    return NextResponse.json({ mode: "live", products: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 503 }); }
}
