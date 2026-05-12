import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReviewsDashboard from "@/components/account/ReviewsDashboard";

export const metadata = {
  title: "Minhas avaliações | TánaMão",
  description: "Gerencie suas reviews de produtos e mantenha seu histórico de feedback.",
};

export default async function ReviewsPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("accessToken") || cookieStore.has("refreshToken");

  if (!isAuthenticated) {
    redirect("/login?redirectTo=/avaliacoes");
  }

  return <ReviewsDashboard />;
}
