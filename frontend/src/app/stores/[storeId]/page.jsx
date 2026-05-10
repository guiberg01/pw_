import { Metadata } from "next";
import StoreDetail from "@/components/store/StoreDetail";

export const metadata = {
  title: "Loja | Marketplace",
  description: "Visualize os produtos e informações da loja",
};

export default function StoreDetailPage() {
  return <StoreDetail />;
}
