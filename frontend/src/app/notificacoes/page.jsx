import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NotificationsDashboard from "@/components/account/NotificationsDashboard";

export const metadata = {
  title: "Notificações | TánaMão",
  description: "Central de alertas, pedidos e novidades da sua conta.",
};

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("accessToken") || cookieStore.has("refreshToken");

  if (!isAuthenticated) {
    redirect("/login?redirectTo=/notificacoes");
  }

  return <NotificationsDashboard />;
}
