import ReviewDashboard from "@/components/seller/reviews/ReviewDashboard";

export const metadata = {
  title: "Avaliações | Seller",
};

export default function SellerReviewsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <ReviewDashboard />
      </div>
    </main>
  );
}
