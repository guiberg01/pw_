"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Copy, Edit, LoaderCircle, Plus, Ticket, Trash2 } from "lucide-react";

import { couponService } from "@/services/couponService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmActionDialog from "@/components/ui/confirm-action-dialog";
import { Field, FieldLabel } from "@/components/ui/field";

const defaultFormData = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "",
  maxUses: "",
  maxUsesPerUser: "",
  maxDiscountAmount: "",
  expiresAt: "",
  products: "",
  stores: "",
  categories: "",
  status: "active",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const joinIds = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) => item?._id || item)
        .filter(Boolean)
        .join(", ")
    : "";

const parseIds = (value) =>
  String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getCouponList = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? [];
};

const getCouponPagination = (payload) => payload?.pagination ?? { page: 1, totalPages: 1, total: 0 };

const CouponScopeSummary = ({ coupon }) => {
  const hasProducts = Array.isArray(coupon.products) && coupon.products.length > 0;
  const hasStores = Array.isArray(coupon.stores) && coupon.stores.length > 0;
  const hasCategories = Array.isArray(coupon.categories) && coupon.categories.length > 0;

  return (
    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
        {hasProducts ? `${coupon.products.length} produto(s)` : "Todos os produtos"}
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
        {hasStores ? `${coupon.stores.length} loja(s)` : "Toda a plataforma"}
      </span>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
        {hasCategories ? `${coupon.categories.length} categoria(s)` : "Todas as categorias"}
      </span>
    </div>
  );
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const payload = await couponService.getAllForAdmin();
      setCoupons(getCouponList(payload));
      setPagination(getCouponPagination(payload));
    } catch (error) {
      toast.error(error.response?.data?.message || "Falha ao carregar cupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCoupons();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const couponStats = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.status === "active").length,
      deleted: coupons.filter((coupon) => coupon.status === "deleted").length,
    }),
    [coupons],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCoupon(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue ?? ""),
      minOrderValue: String(coupon.minOrderValue ?? ""),
      maxUses: String(coupon.maxUses ?? ""),
      maxUsesPerUser: String(coupon.maxUsesPerUser ?? ""),
      maxDiscountAmount: String(coupon.maxDiscountAmount ?? ""),
      expiresAt: toInputDateTime(coupon.expiresAt),
      products: joinIds(coupon.products),
      stores: joinIds(coupon.stores),
      categories: joinIds(coupon.categories),
      status: coupon.status || "active",
    });
    setShowDialog(true);
  };

  const buildPayload = () => ({
    code: formData.code.trim().toUpperCase(),
    discountType: formData.discountType,
    discountValue: Number(formData.discountValue),
    minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : undefined,
    maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
    maxUsesPerUser: formData.maxUsesPerUser ? Number(formData.maxUsesPerUser) : undefined,
    maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
    expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
    products: parseIds(formData.products),
    stores: parseIds(formData.stores),
    categories: parseIds(formData.categories),
    status: formData.status,
  });

  const handleSaveCoupon = async () => {
    if (!formData.code.trim()) {
      toast.error("Informe o código do cupom");
      return;
    }

    if (
      !formData.discountValue ||
      Number.isNaN(Number(formData.discountValue)) ||
      Number(formData.discountValue) <= 0
    ) {
      toast.error("Informe um valor de desconto válido");
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();

      if (editingCoupon) {
        const updatedCoupon = await couponService.update(editingCoupon._id, payload);
        setCoupons((current) => current.map((coupon) => (coupon._id === editingCoupon._id ? updatedCoupon : coupon)));
        toast.success("Cupom atualizado com sucesso");
      } else {
        const createdCoupon = await couponService.create(payload);
        setCoupons((current) => [createdCoupon, ...current]);
        toast.success("Cupom criado com sucesso");
      }

      setShowDialog(false);
      resetForm();
      await loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar cupom");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = (couponId) => {
    setSelectedCouponId(couponId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCoupon = async () => {
    try {
      await couponService.delete(selectedCouponId);
      toast.success("Cupom excluído com sucesso");
      setCoupons((current) => current.filter((coupon) => coupon._id !== selectedCouponId));
      await loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao excluir cupom");
    } finally {
      setShowDeleteConfirm(false);
      setSelectedCouponId(null);
    }
  };

  const copyToClipboard = async (code) => {
    await navigator.clipboard.writeText(code);
    toast.success("Código copiado");
  };

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-slate-950 text-white shadow-2xl shadow-slate-300/40">
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.25),rgba(15,23,42,0.55)_45%,rgba(34,197,94,0.18))]" />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur-sm">
                <Ticket className="h-4 w-4" />
                Cupons
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">Gerenciador de Cupons</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  Crie, edite e exclua cupons com escopo de produto, loja ou categoria.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={openCreateDialog} className="bg-yellow-400 text-slate-950 hover:bg-yellow-500">
                  <Plus className="h-4 w-4" />
                  Novo Cupom
                </Button>
                <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Link>
                </Button>
              </div>
              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Total</div>
                  <div className="mt-1 text-2xl font-black">{couponStats.total}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Ativos</div>
                  <div className="mt-1 text-2xl font-black">{couponStats.active}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Excluídos</div>
                  <div className="mt-1 text-2xl font-black">{couponStats.deleted}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Card className="border-0 bg-white/90 shadow-xl shadow-slate-200/60">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-950">Todos os Cupons</CardTitle>
            <p className="text-sm text-slate-500">
              {pagination.total
                ? `${pagination.total} cupom(ns) encontrados`
                : "Lista atualizada do painel administrativo"}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <LoaderCircle className="mb-4 h-8 w-8 animate-spin text-[#1a4f9c]" />
                <p>Carregando cupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Ticket className="mb-4 h-12 w-12 text-slate-300" />
                <p>Nenhum cupom encontrado. Crie um para começar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Cupom</th>
                      <th className="px-6 py-4">Desconto</th>
                      <th className="px-6 py-4">Limites</th>
                      <th className="px-6 py-4">Escopo</th>
                      <th className="px-6 py-4">Validade</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                              <Ticket className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-950">{coupon.code}</span>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="space-y-1">
                            <div className="font-semibold text-blue-600">
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}%`
                                : `R$ ${Number(coupon.discountValue || 0).toFixed(2)}`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {coupon.maxDiscountAmount
                                ? `Teto: R$ ${Number(coupon.maxDiscountAmount).toFixed(2)}`
                                : "Sem teto de desconto"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-slate-600">
                          <div className="space-y-1 text-xs">
                            <div>Usos totais: {coupon.maxUses ?? "ilimitado"}</div>
                            <div>Usos por usuário: {coupon.maxUsesPerUser ?? "ilimitado"}</div>
                            <div>
                              Pedido mínimo:{" "}
                              {coupon.minOrderValue ? `R$ ${Number(coupon.minOrderValue).toFixed(2)}` : "sem mínimo"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <CouponScopeSummary coupon={coupon} />
                        </td>
                        <td className="px-6 py-4 align-top text-slate-500">
                          {coupon.expiresAt ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(coupon.expiresAt)}
                            </div>
                          ) : (
                            "Sem validade"
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                            {coupon.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(coupon)}>
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-rose-200 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteCoupon(coupon._id)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}</DialogTitle>
            <DialogDescription>
              Preencha os campos do cupom, incluindo escopos de produtos, lojas e categorias.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Código do cupom</FieldLabel>
              <Input name="code" value={formData.code} onChange={handleInputChange} className="uppercase" />
            </Field>

            <Field>
              <FieldLabel>Tipo de desconto</FieldLabel>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </Field>

            <Field>
              <FieldLabel>Valor do desconto</FieldLabel>
              <Input
                name="discountValue"
                type="number"
                step="0.01"
                value={formData.discountValue}
                onChange={handleInputChange}
              />
            </Field>

            <Field>
              <FieldLabel>Valor mínimo do pedido</FieldLabel>
              <Input
                name="minOrderValue"
                type="number"
                step="0.01"
                value={formData.minOrderValue}
                onChange={handleInputChange}
              />
            </Field>

            <Field>
              <FieldLabel>Máximo de desconto</FieldLabel>
              <Input
                name="maxDiscountAmount"
                type="number"
                step="0.01"
                value={formData.maxDiscountAmount}
                onChange={handleInputChange}
              />
            </Field>

            <Field>
              <FieldLabel>Máximo de usos</FieldLabel>
              <Input name="maxUses" type="number" value={formData.maxUses} onChange={handleInputChange} />
            </Field>

            <Field>
              <FieldLabel>Usos por usuário</FieldLabel>
              <Input name="maxUsesPerUser" type="number" value={formData.maxUsesPerUser} onChange={handleInputChange} />
            </Field>

            <Field>
              <FieldLabel>Validade</FieldLabel>
              <Input name="expiresAt" type="datetime-local" value={formData.expiresAt} onChange={handleInputChange} />
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="expired">Expirado</option>
                <option value="sold-out">Esgotado</option>
                <option value="deleted">Excluído</option>
              </select>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Produtos específicos</FieldLabel>
              <Input
                name="products"
                value={formData.products}
                onChange={handleInputChange}
                placeholder="IDs separados por vírgula"
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Lojas específicas</FieldLabel>
              <Input
                name="stores"
                value={formData.stores}
                onChange={handleInputChange}
                placeholder="IDs separados por vírgula"
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Categorias específicas</FieldLabel>
              <Input
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                placeholder="IDs separados por vírgula"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCoupon} disabled={isSaving}>
              {isSaving ? "Salvando..." : editingCoupon ? "Atualizar Cupom" : "Criar Cupom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDeleteCoupon}
        title="Excluir cupom"
        description="Tem certeza que deseja excluir este cupom? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </main>
  );
}
