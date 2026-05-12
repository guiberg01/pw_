"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatCurrency } from "@/lib/formatters";
import { normalizeImageSrc } from "@/lib/imageUtils";
import { favoriteService } from "@/services/favoriteService";
import { toast } from "sonner";
import { Heart, Share2, Star, Zap } from "lucide-react";

const getVariantLabel = (variant) => {
  const values = variant?.attributes && typeof variant.attributes === "object" ? Object.values(variant.attributes) : [];
  const text = values.filter(Boolean).join(" · ");
  return text || variant?.sku || "Variação";
};

export function ProductDetailsClient({ product }) {
  const router = useRouter();
  const variants = useMemo(
    () => [product.mainVariant, ...(product.productVariants ?? [])].filter(Boolean),
    [product.mainVariant, product.productVariants],
  );
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(variants[0]?._id ?? null);

  const selectedVariant = variants.find((variant) => variant._id === selectedId) || variants[0] || null;
  const imageUrl = selectedVariant?.imageUrl || product.mainImageUrl || "/placeholder-product.png";
  const favoriteButtonLabel = isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos";
  const normalizedImageUrl = normalizeImageSrc(imageUrl);
  const stock = Number(selectedVariant?.stock ?? 0);
  const price = Number(selectedVariant?.price ?? product.basePrice ?? 0);
  const previousPrice =
    Number(selectedVariant?.previousPrice ?? product.basePrice ?? 0) > price
      ? Number(selectedVariant?.previousPrice ?? product.basePrice)
      : null;
  const purchaseCount = Math.max(0, Number(product?.purchaseCount ?? 0) || 0);
  const purchaseLabel = `${purchaseCount === 0 ? "Seja o primeiro a comprar o produto" : `${purchaseCount} ${purchaseCount === 1 ? "compra" : "compras"}`}`;
  const maxAllowed = Math.min(stock || 0, product.maxPerPerson || Infinity);
  const variantDetails = [
    { label: "SKU", value: selectedVariant?.sku || "-" },
    { label: "Estoque", value: stock },
    { label: "Máx. por pessoa", value: Number.isFinite(maxAllowed) ? maxAllowed : "Sem limite" },
  ];
  const attributeEntries = Object.entries(selectedVariant?.attributes || {}).filter(
    ([, value]) => value != null && value !== "",
  );

  useEffect(() => {
    let mounted = true;

    const loadFavoriteState = async () => {
      try {
        const data = await favoriteService.getMyFavorites({ limit: 100 });
        if (!mounted) return;

        const favorites = data?.items ?? [];
        setIsFavorite(
          favorites.some((favorite) => String(favorite?.product?._id ?? favorite?.product?.id) === String(product._id)),
        );
      } catch (error) {
        if (!mounted) return;
      }
    };

    loadFavoriteState();

    return () => {
      mounted = false;
    };
  }, [product._id]);

  const handleBuyNow = (e) => {
    e.preventDefault();
    const variantId = selectedVariant?._id || product.mainVariant?._id || product._id;
    router.push(`/checkout?productId=${variantId}&quantity=1`);
  };

  const handleToggleFavorite = async () => {
    try {
      setIsFavoriteLoading(true);
      const result = await favoriteService.toggleFavorite(product._id);
      setIsFavorite(Boolean(result?.isFavorited));
      toast.success(result?.isFavorited ? "Produto adicionado aos favoritos" : "Produto removido dos favoritos");
    } catch (error) {
      const message = error?.response?.data?.message || "Não foi possível atualizar seus favoritos.";
      toast.error(message);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-slate-600">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link href="/products" className="hover:text-blue-600">
            Produtos
          </Link>
          <span className="mx-2">›</span>
          <span className="text-slate-900 font-medium">{product.name}</span>
        </div>
      </div>

      <div className="border-b border-slate-200 pb-4 gap-6 flex justify-between px-4 py-8 max-w-6xl mx-auto">
        <div className="flex flex-col justify-end items-start">
          <Link href={`/stores/${product.store.slug}`}>
            <p className="text-sm text-slate-500 hover:text-blue-600 transition mb-1">Loja: {product.store.name}</p>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        </div>
        <div className="flex-col flex text-right items-end justify-end">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-slate-600 whitespace-nowrap">(0 avaliações)</span>
          </div>
          <span className="block text-sm font-medium text-slate-500 mt-1">{purchaseLabel}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="bg-white rounded-lg overflow-hidden border border-slate-200 aspect-square relative">
                <Image src={normalizedImageUrl} alt={product.name} fill className="object-cover" priority />
                <div className="flex gap-2 items-top justify-end absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => void handleToggleFavorite()}
                    disabled={isFavoriteLoading}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium backdrop-blur-sm transition ${
                      isFavorite ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 hover:bg-slate-50"
                    } ${isFavoriteLoading ? "cursor-not-allowed opacity-70" : ""}`}
                    title={favoriteButtonLabel}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button className="flex items-center gap-2 px-3 backdrop-blur-sm py-2 transition border border-slate-300 rounded-lg hover:bg-slate-50 text-[12px] font-medium">
                    <Share2 title="Compartilhar" className="h-4 w-4" />
                  </button>
                </div>
                {product.highlighted && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Destaque
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{formatCurrency(price)}</span>
                {previousPrice && (
                  <span className="text-lg line-through text-slate-500">{formatCurrency(previousPrice)}</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
                {variantDetails.map((detail) => (
                  <div key={detail.label} className="rounded-lg bg-white/80 px-3 py-2 border border-blue-100">
                    <div className="text-xs uppercase tracking-wide text-slate-500">{detail.label}</div>
                    <div className="font-semibold">{detail.value}</div>
                  </div>
                ))}
              </div>
              {stock <= 5 && stock > 0 && (
                <p className="text-sm text-orange-600 font-medium">Apenas {stock} unidade(s) disponível(is)</p>
              )}
              {stock <= 0 && <p className="text-sm text-red-600 font-medium">Produto fora de estoque</p>}
            </div>

            {variants.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {variants.map((variant) => {
                  const isActive = variant._id === selectedVariant?._id;
                  return (
                    <button
                      key={variant._id}
                      type="button"
                      onClick={() => setSelectedId(variant._id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        isActive
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      {/*<div className="text-sm font-semibold">{getVariantLabel(variant)}</div> */}
                      <div className="text-sm font-semibold">Variação: {variant.sku}</div>
                      <div className="mt-1 flex items-center justify-end gap-3 text-xs text-slate-500">
                        <span>{Number(variant.stock ?? 0)} em estoque</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AddToCartButton
                key={selectedVariant?._id || product.mainVariant?._id || product._id}
                productVariantId={selectedVariant?._id || product.mainVariant?._id || product._id}
                stock={stock}
                maxPerPerson={product.maxPerPerson}
              />
              <button
                onClick={handleBuyNow}
                disabled={stock <= 0}
                className={`h-10 rounded-md font-semibold flex py-5.5 self-end items-center justify-center gap-2 transition duration-200 ${
                  stock <= 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-yellow-400 text-blue-900 hover:bg-yellow-300 active:scale-95"
                }`}
                title="Comprar agora e ir direto para checkout"
              >
                <Zap className="h-4 w-4" />
                Comprar agora
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t border-slate-200 grid gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Descrição do produto</h3>
            <div className="pt-1 text-sm text-slate-700">{product.description}</div>
          </div>
          {attributeEntries.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <h3 className="text-lg font-semibold text-slate-900">Atributos da variação</h3>
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {attributeEntries.map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">{key}</div>
                      <div className="font-medium text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-200 grid gap-4">
          <h3 className="text-lg font-semibold text-slate-900">Informações do produto</h3>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Peso</div>
                <div className="font-medium text-slate-900">
                  {product.weight != null && product.weight !== "" ? product.weight : "Não especificado"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Comprimento</div>
                <div className="font-medium text-slate-900">
                  {product.length != null && product.length !== "" ? product.length : "Não especificado"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Largura</div>
                <div className="font-medium text-slate-900">
                  {product.width != null && product.width !== "" ? product.width : "Não especificado"}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Altura</div>
                <div className="font-medium text-slate-900">
                  {product.height != null && product.height !== "" ? product.height : "Não especificado"}
                </div>
              </div>
            </div>

            {product.datasheet && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Datasheet</div>
                <a
                  href={product.datasheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Abrir datasheet
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
