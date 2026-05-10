import ProductListClient from "@/components/product/ProductListClient";
import { productService } from "@/services/productService";

export default async function ProductsPage({ searchParams }) {
  const search = typeof searchParams?.search === "string" ? searchParams.search : "";
  const categoryId = typeof searchParams?.categoryId === "string" ? searchParams.categoryId : "";
  const page = typeof searchParams?.page === "string" ? Number(searchParams.page) : 1;
  const limit = typeof searchParams?.limit === "string" ? Number(searchParams.limit) : 24;

  const products = await productService.getAllProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 24,
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_40%,#eef2ff_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blue-600">Você está vendo</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Todos os Produtos</h1>
            </div>
          </div>
        </div>

        <ProductListClient
          key={`${search || ""}:${categoryId || ""}:${page}:${limit}`}
          initialProducts={products}
          initialSearch={search}
          initialCategoryId={categoryId}
          syncToUrl
        />
      </div>
    </main>
  );
}
