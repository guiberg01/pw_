import { ProductDetailsClient } from "@/components/product/ProductDetailsClient";
import Link from "next/link";

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  let product = null;

  try {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3980/api";
    const res = await fetch(`${base}/products/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      product = data.data;
    }
  } catch (err) {
    console.error("Erro ao buscar produto no servidor:", err);
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-700 mb-4">Produto não encontrado</p>
          <Link href="/products" className="text-blue-600 hover:underline">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  return <ProductDetailsClient product={product} />;
}
