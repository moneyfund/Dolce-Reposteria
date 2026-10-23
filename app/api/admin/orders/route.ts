import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await requireStaff(request);
  if (!session) return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  try {
    const docs = await session.backend.db.collection("orders").orderBy("createdAt", "desc").limit(150).get();
    return NextResponse.json({ orders: docs.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
  } catch { return NextResponse.json({ error: "No se pudieron cargar pedidos" }, { status: 503 }); }
}
