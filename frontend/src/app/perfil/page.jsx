import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfileDashboard from "@/components/account/ProfileDashboard";

export const metadata = {
  title: "Meu perfil | TánaMão",
  description: "Central da conta do cliente com resumo, atalhos e dados pessoais.",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("accessToken") || cookieStore.has("refreshToken");

  if (!isAuthenticated) {
    redirect("/login?redirectTo=/perfil");
  }

  return <ProfileDashboard />;
}
