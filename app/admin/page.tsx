import type { Metadata } from "next";
import AdminDashboard from "@/components/admin-dashboard";
export const metadata: Metadata = { title: "DOLCE Manager" };
export default function AdminPage() { return <AdminDashboard/>; }
