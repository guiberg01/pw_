import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FavoritesDashboard from "@/components/account/FavoritesDashboard";

export const metadata = {
  title: "Favoritos | TánaMão",
  description: "Lista de produtos salvos pelo cliente.",
};

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("accessToken") || cookieStore.has("refreshToken");

  if (!isAuthenticated) {
    redirect("/login?redirectTo=/favoritos");
  }

  return <FavoritesDashboard />;
}
