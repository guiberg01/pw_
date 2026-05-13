import ProductListClient from "@/components/product/ProductListClient";
import { productService } from "@/services/productService";

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const search = typeof resolvedSearchParams?.search === "string" ? resolvedSearchParams.search : "";
  const categoryId = typeof resolvedSearchParams?.categoryId === "string" ? resolvedSearchParams.categoryId : "";
  const location = typeof resolvedSearchParams?.location === "string" ? resolvedSearchParams.location : "";
  const promotion =
    typeof resolvedSearchParams?.promotion === "string" ? resolvedSearchParams.promotion === "true" : false;
  const page = typeof resolvedSearchParams?.page === "string" ? Number(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams?.limit === "string" ? Number(resolvedSearchParams.limit) : 24;

  const products = await productService.getAllProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    location: location || undefined,
    onPromotion: promotion || undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 24,
  });

  let pageTitle = "Todos os Produtos";
  if (search) pageTitle = `Resultados para "${search}"`;
  if (promotion) pageTitle = "Ofertas do Dia";
  if (categoryId) pageTitle = "Produtos da Categoria";
  if (location) pageTitle = `Produtos em ${location}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_40%,#eef2ff_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blue-600">Você está vendo</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{pageTitle}</h1>
            </div>
          </div>
        </div>

        <ProductListClient
          key={`${search || ""}:${categoryId || ""}:${location || ""}:${promotion}:${page}:${limit}`}
          initialProducts={products}
          initialCategoryId={categoryId}
          initialPromotion={promotion}
          syncToUrl
        />
      </div>
    </main>
  );
}
