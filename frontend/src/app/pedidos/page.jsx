import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrdersDashboard from "@/components/account/OrdersDashboard";

export const metadata = {
  title: "Meus pedidos | TánaMão",
  description: "Histórico de compras, status e pagamentos do cliente.",
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("accessToken") || cookieStore.has("refreshToken");

  if (!isAuthenticated) {
    redirect("/login?redirectTo=/pedidos");
  }

  return <OrdersDashboard />;
}
