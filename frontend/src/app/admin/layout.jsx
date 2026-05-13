import { AdminGuard } from "@/components/auth/AdminGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="flex h-screen w-full min-h-0 bg-slate-50 font-sans">{children}</div>
    </AdminGuard>
  );
}
