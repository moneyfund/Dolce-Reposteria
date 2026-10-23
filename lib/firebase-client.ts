"use client";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const hasFirebaseClient = Boolean(config.apiKey && config.projectId && config.appId);
export function firebaseApp(): FirebaseApp {
  if (!hasFirebaseClient) throw new Error("Firebase público no está configurado");
  return getApps().length ? getApp() : initializeApp(config);
}
export function firebaseAuth(): Auth { return getAuth(firebaseApp()); }
