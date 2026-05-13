"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Store, CheckCircle, XCircle, Trash2, LoaderCircle, ShieldAlert, ArrowLeft } from "lucide-react";

import { adminService } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const StatusBadge = ({ status }) => {
  const statusStyles = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    suspended: "bg-rose-100 text-rose-800 border-rose-200",
    inactive: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const statusNames = {
    active: "Ativa",
    pending: "Pendente",
    suspended: "Suspensa",
    inactive: "Inativa",
  };

  const style = statusStyles[status] || statusStyles.inactive;
  const name = statusNames[status] || status;

  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>{name}</span>;
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // <-- Já começa como true
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStores = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return stores;

    return stores.filter((store) => {
      const ownerName = store.owner?.name?.toLowerCase() || "";
      const ownerEmail = store.owner?.email?.toLowerCase() || "";

      return (
        store.name.toLowerCase().includes(normalizedSearch) ||
        ownerName.includes(normalizedSearch) ||
        ownerEmail.includes(normalizedSearch)
      );
    });
  }, [searchTerm, stores]);

  const loadStores = async (page) => {
    setIsLoading(true);
    try {
      const data = await adminService.getStores({ page, limit: 10 });
      setStores(data.stores);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Falha ao carregar a lista de lojas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    adminService
      .getStores({ page: 1, limit: 10 })
      .then((data) => {
        if (isMounted) {
          setStores(data.stores);
          setPagination(data.pagination);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error("Falha ao carregar a lista inicial de lojas.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (storeId, newStatus) => {
    setIsProcessing(true);
    try {
      const updatedStore = await adminService.updateStoreStatus(storeId, newStatus);
      toast.success(`Status da loja atualizado para ${newStatus}`);
      setStores((currentStores) => currentStores.map((s) => (s._id === storeId ? { ...s, ...updatedStore } : s)));
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao atualizar status da loja");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStore = async (storeId, storeName) => {
    if (!window.confirm(`Tem certeza que deseja deletar a loja "${storeName}"? Isso removerá o acesso do vendedor.`))
      return;

    setIsProcessing(true);
    try {
      await adminService.deleteStore(storeId);
      toast.success("Loja deletada com sucesso!");
      loadStores(pagination.page);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Ocorreu um erro ao tentar deletar a loja. Verifique se ela possui produtos ativos.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="h-full min-h-0 w-ful bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-slate-950 text-white shadow-2xl shadow-slate-300/40">
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.25),rgba(15,23,42,0.55)_45%,rgba(34,197,94,0.18))]" />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur-sm">
                <Store className="h-4 w-4" />
                Gestão de Lojas
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">Todos os Vendedores</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  Aprove novos vendedores, suspenda lojas ou audite o marketplace. Monitore status, bloqueios e ações de
                  cada loja.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Card className="border-0 bg-white/90 shadow-xl shadow-slate-200/60">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Store className="h-5 w-5 text-yellow-500" /> Todas as Lojas
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nome da loja ou dono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#1a4f9c]"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#1a4f9c] mb-4" />
                <p>Carregando base de lojas...</p>
              </div>
            ) : stores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Store className="h-12 w-12 text-slate-300 mb-4" />
                <p>Nenhuma loja encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Loja</th>
                      <th className="px-6 py-4">Proprietário</th>
                      <th className="px-6 py-4">Criada em</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.map((store) => (
                      <tr key={store._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{store.name}</td>
                        <td className="px-6 py-4">
                          <p className="text-slate-800 font-medium">{store.owner?.name || "Sem Dono"}</p>
                          <p className="text-slate-500 text-xs">{store.owner?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(store.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <StatusBadge status={store.status} />
                            {store.status === "blocked" && (
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                {store.blockedRole === "admin" ? "Bloqueada por admin" : "Bloqueio interno"}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {/* Botão Aprovar */}
                          {store.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(store._id, "active")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                            </Button>
                          )}

                          {/* Botão Suspender */}
                          {store.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(store._id, "suspended")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Suspender
                            </Button>
                          )}

                          {/* Botão Reativar */}
                          {store.status === "suspended" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(store._id, "active")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Reativar
                            </Button>
                          )}

                          {/* Botão Deletar (Cuidado: backend valida se há produtos ativos) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50"
                            disabled={isProcessing}
                            onClick={() => handleDeleteStore(store._id, store.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {pagination.totalPages > 1 && searchTerm.trim().length === 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                <span className="text-sm text-slate-500">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1 || isLoading}
                    onClick={() => loadStores(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages || isLoading}
                    onClick={() => loadStores(pagination.page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
