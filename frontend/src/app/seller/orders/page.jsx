import SellerOrdersDashboard from "@/components/seller/orders/SellerOrdersDashboard";

export const metadata = {
  title: "Pedidos | Seller",
};

export default function SellerOrdersPage() {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-7xl">
        <SellerOrdersDashboard />
      </div>
    </main>
  );
}
