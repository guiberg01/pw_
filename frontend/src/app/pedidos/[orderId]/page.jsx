import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrderDetailsView from "@/components/account/OrderDetailsView";

export const metadata = {
  title: "Detalhes do pedido | TánaMão",
  description: "Veja o conteúdo do pedido, rastreamento, recebimento e avaliações.",
};

export default async function OrderDetailsPage({ params }) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("accessToken") || cookieStore.has("refreshToken");

  if (!isAuthenticated) {
    redirect("/login?redirectTo=/pedidos");
  }

  const resolvedParams = await params;
  const orderId = String(resolvedParams?.orderId ?? "").trim();
  const isValidOrderId = /^[a-fA-F0-9]{24}$/.test(orderId);

  if (!isValidOrderId) {
    redirect("/pedidos");
  }

  return <OrderDetailsView orderId={orderId} />;
}
