"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Edit2, HardDrive, LoaderCircle, Package, Plus, Search, Trash2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDeleteDialog from "@/components/ui/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
import { categoryService } from "@/services/categoryService";
import { storeService } from "@/services/storeService";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/imageUtils";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
};

const formatMaybe = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const formatAttributes = (attributes) => {
  if (!attributes || typeof attributes !== "object") return "—";

  const entries = Object.entries(attributes);
  if (entries.length === 0) return "—";

  return entries.map(([key, val]) => `${key}: ${val}`).join(" • ");
};

const InfoItem = ({ label, value, mono = false }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 text-sm text-slate-900 ${mono ? "font-mono text-[11px] break-all" : ""}`}>{value}</p>
  </div>
);

const ProductCard = ({ product, onEdit, onDelete, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mainVariant = product.mainVariant || {};
  const extraVariants = product.productVariants || [];
  const categoryLabels = Array.isArray(product.category)
    ? product.category.map((category) => category?.name || category?._id || category).filter(Boolean)
    : [product.category?.name || product.category?._id].filter(Boolean);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await storeService.deleteProduct(product._id);
      setConfirmOpen(false);
      toast.success("Produto excluído com sucesso");
      await onRefresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao excluir produto");
    } finally {
      setIsDeleting(false);
    }
  };

  const variantCount = extraVariants.length > 0 ? extraVariants.length : 0;
  const categoryText = categoryLabels.length > 0 ? categoryLabels.join(" • ") : "Sem categoria";

  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white/95 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <div className="grid gap-4 md:grid-cols-[140px_1fr_200px] lg:grid-cols-[140px_1fr_300px] p-4">
        {/* Imagem */}
        <div className="relative h-full min-h-35 w-full">
          {mainVariant.imageUrl ? (
            <Image
              src={normalizeImageSrc(mainVariant.imageUrl)}
              alt={product.name}
              fill
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-slate-400">
              <Package className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Dados principais */}
        <div className="flex flex-col justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 line-clamp-1">{product.name}</h3>
            <p className="text-xs text-slate-500 mb-2">{categoryText}</p>
            <p className="text-sm text-slate-600 line-clamp-2">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold uppercase text-slate-500">Status</p>
              <p className="mt-1 text-slate-900">{product.status || "—"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold uppercase text-slate-500">Destaque</p>
              <p className="mt-1 text-slate-900">{product.highlighted ? "Sim" : "Não"}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-blue-600">
            <ChevronDown className={`mr-1 inline h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            {variantCount > 0
              ? `${variantCount} variação${variantCount !== 1 ? "s" : ""} extra${variantCount !== 1 ? "s" : ""}`
              : isExpanded
                ? "Clique para recolher"
                : "Clique para ver detalhes"}
          </p>
        </div>

        {/* Preço e estoque */}
        <div className="flex flex-col justify-between gap-2">
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-500">Preço</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(mainVariant.price)}</p>
            </div>

            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase text-slate-500">
                <HardDrive className="h-3 w-3" /> Estoque
              </p>
              <p
                className={`font-bold ${mainVariant.stock > 10 ? "text-green-600" : mainVariant.stock > 0 ? "text-orange-600" : "text-rose-600"}`}
              >
                {mainVariant.stock} un.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className=" gap-1"
              onClick={() => onEdit(product)}
              disabled={isDeleting}
            >
              <Edit2 className="h-3 w-3" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
      {/* Variantes expandidas */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem label="ID do produto" value={product._id} mono />
            <InfoItem label="Limite por pessoa" value={formatMaybe(product.maxPerPerson)} />
            <InfoItem label="Categoria" value={categoryText} />
            <InfoItem label="Loja" value={product.store?.name || product.store?._id || "—"} />
            <InfoItem
              label="Rating"
              value={`${formatMaybe(product.rating?.ratingCount)} avaliações • média ${formatMaybe(product.rating?.average)}`}
            />
            <InfoItem label="Criado em" value={formatDate(product.createdAt)} />
            <InfoItem label="Atualizado em" value={formatDate(product.updatedAt)} />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">Variação principal</h4>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <InfoItem label="SKU" value={mainVariant.sku || "—"} mono />
              <InfoItem label="Preço" value={formatCurrency(mainVariant.price)} />
              <InfoItem label="Estoque" value={formatMaybe(mainVariant.stock)} />
              <InfoItem label="Imagem" value={mainVariant.imageUrl || "—"} mono />
              <InfoItem label="Ficha técnica" value={formatMaybe(mainVariant.datasheet)} />
              <InfoItem label="Peso" value={formatMaybe(mainVariant.weight)} />
              <InfoItem label="Comprimento" value={formatMaybe(mainVariant.length)} />
              <InfoItem label="Largura" value={formatMaybe(mainVariant.width)} />
              <InfoItem label="Altura" value={formatMaybe(mainVariant.height)} />
              <InfoItem label="Em promoção" value={mainVariant.onPromotion ? "Sim" : "Não"} />
              <InfoItem label="Preço promocional" value={formatCurrency(mainVariant.salePrice)} />
              <InfoItem label="Desconto (%)" value={formatMaybe(mainVariant.discountPercent)} />
            </div>
            <InfoItem label="Atributos" value={formatAttributes(mainVariant.attributes)} />
          </div>

          {extraVariants.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-bold text-slate-900">Variações extras</h4>
              <div className="space-y-3">
                {extraVariants.map((variant, idx) => (
                  <div
                    key={variant._id || idx}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    {variant.imageUrl && (
                      <div className="relative h-16 w-16 shrink-0">
                        <Image
                          src={normalizeImageSrc(variant.imageUrl)}
                          alt={`Variação ${idx + 1}`}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">SKU: {variant.sku}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span>{formatCurrency(variant.price)}</span>
                        <span>{formatMaybe(variant.stock)} un.</span>
                        <span>{variant.onPromotion ? "Em promoção" : "Sem promoção"}</span>
                      </div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        <InfoItem label="ID" value={variant._id || "—"} mono />
                        <InfoItem label="Imagem" value={variant.imageUrl || "—"} mono />
                        <InfoItem label="Ficha técnica" value={formatMaybe(variant.datasheet)} />
                        <InfoItem label="Peso" value={formatMaybe(variant.weight)} />
                        <InfoItem label="Comprimento" value={formatMaybe(variant.length)} />
                        <InfoItem label="Largura" value={formatMaybe(variant.width)} />
                        <InfoItem label="Altura" value={formatMaybe(variant.height)} />
                        <InfoItem label="Preço promocional" value={formatCurrency(variant.salePrice)} />
                        <InfoItem label="Desconto (%)" value={formatMaybe(variant.discountPercent)} />
                      </div>
                      <div className="mt-2">
                        <InfoItem label="Atributos" value={formatAttributes(variant.attributes)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Delete confirmation dialog (reusable) */}
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        name={product.name}
        id={product._id}
        imageUrl={mainVariant.imageUrl}
        onConfirm={confirmDelete}
        isProcessing={isDeleting}
      />
    </Card>
  );
};

export default function SellerProductsListPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Usa ref para rastrear filtros anteriores sem causar re-renders
  const previousFiltersRef = useRef({ searchTerm: "", selectedCategory: "", selectedStatus: "" });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const handlePopState = () => {
      router.refresh();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  // Carrega as categorias na montagem do componente
  useEffect(() => {
    (async () => {
      try {
        const response = await categoryService.getActiveCategories({ page: 1, limit: 100 });
        setCategories(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Falha ao carregar categorias:", error);
      }
    })();
  }, []);

  // Carrega os produtos quando page, searchTerm ou selectedCategory mudam
  useEffect(() => {
    (async () => {
      // Detecta se os filtros mudaram (não apenas a página)
      const filtersChanged =
        searchTerm !== previousFiltersRef.current.searchTerm ||
        selectedCategory !== previousFiltersRef.current.selectedCategory ||
        selectedStatus !== previousFiltersRef.current.selectedStatus;

      if (filtersChanged && page !== 1) {
        setPage(1);
        return;
      }

      setIsLoading(true);
      try {
        const response = await storeService.getMyStoreProducts({
          page,
          limit,
          search: searchTerm || undefined,
          categoryId: selectedCategory || undefined,
          status: selectedStatus || undefined,
        });

        setProducts(response.items || []);
        setTotalPages(response.pagination?.totalPages || 0);

        // Atualiza os filtros anteriores apenas APÓS carregar
        if (filtersChanged) {
          previousFiltersRef.current = { searchTerm, selectedCategory, selectedStatus };
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Falha ao carregar produtos");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [page, searchTerm, selectedCategory, selectedStatus]);

  // Função para recarregar produtos (usada no ProductCard)
  const loadProducts = useCallback(async () => {
    // Carrega com os valores atuais
    setIsLoading(true);
    try {
      const response = await storeService.getMyStoreProducts({
        page,
        limit,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });

      setProducts(response.items || []);
      setTotalPages(response.pagination?.totalPages || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, selectedCategory, selectedStatus]);

  const handleEdit = (product) => {
    router.push(`/seller/products/${product._id}/edit`);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  return (
    <main className="min-h-[calc(100vh-130px)] bg-[radial-gradient(circle_at_top,#eff6ff,#f8fafc_45%,#eef2ff_100%)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[#1a4f9c] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-end gap-2">
                <Link href="/seller" className="text-sm text-cyan-300 hover:underline">
                  <ChevronLeft className="inline h-4 w-4" />
                </Link>
                <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-cyan-300">Catálogo</p>
              </div>
              <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">Meus produtos</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                Gerencie seus produtos, variações e estoque em um só lugar.
              </p>
            </div>

            <Button asChild className="h-10 gap-2 bg-[#fdc700] text-[#001f4d]! hover:text-[#fdc700]!">
              <Link href="/seller/products/create">
                <Plus className="h-4 w-4 " /> Criar novo produto
              </Link>
            </Button>
          </div>
        </section>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm">Filtros e pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Buscar produto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Nome, SKU..." value={searchInput} onChange={handleSearchChange} className="pl-9" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12">
            <div className="flex items-center gap-2 text-slate-600">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando produtos...
            </div>
          </div>
        ) : products.length === 0 ? (
          <Card className="border-dashed bg-white/80">
            <CardContent className="py-12 text-center">
              <div className="mx-auto max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-900">Nenhum produto encontrado</p>
                <p className="mt-1 text-sm text-slate-600">
                  {searchTerm || selectedCategory || selectedStatus
                    ? "Tente ajustar seus filtros"
                    : "Comece criando seu primeiro produto"}
                </p>
                {!searchTerm && !selectedCategory && !selectedStatus && (
                  <Button asChild className="mt-4 gap-2">
                    <Link href="/seller/products/create">
                      <Plus className="h-4 w-4" /> Criar primeiro produto
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={handleEdit}
                onDelete={() => {}}
                onRefresh={loadProducts}
              />
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Anterior
                </Button>
                <span className="text-sm text-slate-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
