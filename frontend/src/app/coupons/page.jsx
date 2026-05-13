"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Zap } from "lucide-react";
import { couponService } from "@/services/couponService";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setIsLoading(true);
        const data = await couponService.list({
          status: "active",
          limit: 100,
          page: 1,
        });

        // Filtrar apenas cupons válidos (não expirados)
        const now = new Date();
        const validCoupons = (data || []).filter((coupon) => {
          if (!coupon.expiresAt) return true;
          return new Date(coupon.expiresAt) > now;
        });

        setCoupons(validCoupons);
        setFilteredCoupons(validCoupons);
      } catch (error) {
        console.error("Erro ao carregar cupons:", error);
        setCoupons([]);
        setFilteredCoupons([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCoupons();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const filtered = coupons.filter((coupon) => {
        const search = searchTerm.toLowerCase();
        return (
          coupon.code.toLowerCase().includes(search) ||
          coupon.description?.toLowerCase().includes(search) ||
          coupon.stores?.some((store) => store.name?.toLowerCase().includes(search)) ||
          coupon.categories?.some((cat) => cat.name?.toLowerCase().includes(search)) ||
          coupon.products?.some((prod) => prod.name?.toLowerCase().includes(search))
        );
      });
      setFilteredCoupons(filtered);
    }, 0);
  }, [searchTerm, coupons]);

  const handleCopyCoupon = (couponCode) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedId(couponCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `R$ ${coupon.discountValue.toFixed(2)} OFF`;
    }
  };

  const getDaysUntilExpire = (expiresAt) => {
    if (!expiresAt) return "Sem validade";
    const now = new Date();
    const expire = new Date(expiresAt);
    const diffTime = expire - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expirado";
    if (diffDays === 1) return "Expira amanhã";
    return `Expira em ${diffDays} dias`;
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-blue-50 to-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
            <Zap size={18} />
            Ofertas Especiais
          </div>
          <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Cupons de Desconto</h1>
          <p className="text-lg text-slate-600">Encontre cupons incríveis para economizar nas suas compras</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Buscar cupom, loja ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCoupons.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-16 text-center">
            <Zap size={48} className="mb-4 text-slate-400" />
            <h3 className="mb-2 text-xl font-bold text-slate-900">
              {searchTerm ? "Nenhum cupom encontrado" : "Nenhum cupom disponível"}
            </h3>
            <p className="text-slate-600">
              {searchTerm ? "Tente buscar por outro termo" : "Volte mais tarde para confira as nossas ofertas"}
            </p>
          </div>
        )}

        {/* Coupons Grid */}
        {!isLoading && filteredCoupons.length > 0 && (
          <div>
            <p className="mb-6 text-sm font-medium text-slate-600">Mostrando {filteredCoupons.length} cupom(ns)</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCoupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-blue-300"
                >
                  {/* Header */}
                  <div className="border-b border-slate-100 bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      <Zap size={14} />
                      {getDiscountDisplay(coupon)}
                    </div>
                    <h3 className="text-2xl font-black">{coupon.code}</h3>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4 px-6 py-4">
                    {coupon.description && <p className="text-sm text-slate-600">{coupon.description}</p>}

                    {/* Minimum Order Value */}
                    {coupon.minOrderValue && (
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-semibold">Mínimo:</span> R$ {coupon.minOrderValue.toFixed(2)}
                      </div>
                    )}

                    {/* Scopes */}
                    {(coupon.stores?.length > 0 || coupon.categories?.length > 0 || coupon.products?.length > 0) && (
                      <div className="space-y-2">
                        {coupon.stores?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700">Lojas:</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {coupon.stores.slice(0, 2).map((store) => (
                                <span
                                  key={store._id}
                                  className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                                >
                                  {store.name}
                                </span>
                              ))}
                              {coupon.stores.length > 2 && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  +{coupon.stores.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {coupon.categories?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700">Categorias:</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {coupon.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat._id}
                                  className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700"
                                >
                                  {cat.name}
                                </span>
                              ))}
                              {coupon.categories.length > 2 && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  +{coupon.categories.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {coupon.products?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700">Produtos:</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {coupon.products.slice(0, 2).map((prod) => (
                                <span
                                  key={prod._id}
                                  className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700"
                                >
                                  {prod.name}
                                </span>
                              ))}
                              {coupon.products.length > 2 && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  +{coupon.products.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expiration */}
                    <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                      {getDaysUntilExpire(coupon.expiresAt)}
                    </div>

                    {/* Usage Info */}
                    {(coupon.maxUses || coupon.maxUsesPerUser) && (
                      <div className="text-xs text-slate-500">
                        {coupon.maxUses && (
                          <p>
                            <span className="font-semibold">
                              {coupon.usedCount || 0}/{coupon.maxUses}
                            </span>{" "}
                            usados
                          </p>
                        )}
                        {coupon.maxUsesPerUser && (
                          <p>
                            Máximo <span className="font-semibold">{coupon.maxUsesPerUser}</span> por usuário
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 px-6 py-3">
                    <button
                      onClick={() => handleCopyCoupon(coupon.code)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
                    >
                      {copiedId === coupon.code ? (
                        <>
                          <Check size={18} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
