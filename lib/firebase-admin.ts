import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
export function getBackend() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return { db: getFirestore(app), auth: getAuth(app) };
}
export async function requireStaff(request: Request) {
  const backend = getBackend();
  if (!backend) return null;
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) return null;
  try {
    const verified = await backend.auth.verifyIdToken(token, true);
    const doc = await backend.db.collection("staff").doc(verified.uid).get();
    const role = doc.data()?.role;
    return doc.exists && ["owner", "admin"].includes(role) ? { backend, uid: verified.uid } : null;
  } catch { return null; }
}
