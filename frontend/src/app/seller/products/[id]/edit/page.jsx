"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categoryService } from "@/services/categoryService";
import { storeService } from "@/services/storeService";
import VariantSection from "@/components/seller/products/VariantSection";

const createLocalId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const normalizeOptionalNumber = (value) =>
  value === "" || value === null || value === undefined ? null : Number(value);

const normalizeAttributesObjectToArray = (attributes) => {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return [];

  return Object.entries(attributes).map(([name, value]) => ({ name, value }));
};

const createVariantPayload = (variant) => ({
  ...variant,
  price: Number(variant.price),
  stock: Number(variant.stock),
  datasheet: variant.datasheet?.trim() || null,
  weight: normalizeOptionalNumber(variant.weight),
  length: normalizeOptionalNumber(variant.length),
  width: normalizeOptionalNumber(variant.width),
  height: normalizeOptionalNumber(variant.height),
  onPromotion: Boolean(variant.onPromotion),
  salePrice: normalizeOptionalNumber(variant.salePrice),
  discountPercent: normalizeOptionalNumber(variant.discountPercent),
  attributes: (variant.attributes || []).reduce((acc, attr) => {
    if (attr.name && attr.name.trim() && attr.value && attr.value.trim()) {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {}),

  ...(variant._id ? { variantId: variant._id } : {}),
});

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    highlighted: false,
    maxPerPerson: "",
    status: "active",
    mainVariant: {
      sku: "",
      price: "",
      stock: "",
      imageUrl: "",
      datasheet: "",
      weight: "",
      length: "",
      width: "",
      height: "",
      onPromotion: false,
      salePrice: "",
      discountPercent: "",
      attributes: [],
    },
    variants: [],
  });

  const [errors, setErrors] = useState({});
  const [removedVariantIds, setRemovedVariantIds] = useState([]);

  // Carregar categorias e produto
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, productResponse] = await Promise.all([
          categoryService.getActiveCategories({ page: 1, limit: 100 }),
          storeService.getProductById(productId),
        ]);

        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);

        const productCategory = Array.isArray(productResponse.category)
          ? productResponse.category[0]?._id || ""
          : productResponse.category?._id || "";

        // Reset removed variants quando carrega novo produto
        setRemovedVariantIds([]);
        setFormData({
          name: productResponse.name || "",
          description: productResponse.description || "",
          category: productCategory,
          highlighted: Boolean(productResponse.highlighted),
          maxPerPerson: productResponse.maxPerPerson ?? "",
          status: productResponse.status || "active",
          mainVariant: {
            sku: productResponse.mainVariant?.sku || "",
            price: productResponse.mainVariant?.price ?? "",
            stock: productResponse.mainVariant?.stock ?? "",
            imageUrl: productResponse.mainVariant?.imageUrl || "",
            datasheet: productResponse.mainVariant?.datasheet || "",
            weight: productResponse.mainVariant?.weight ?? "",
            length: productResponse.mainVariant?.length ?? "",
            width: productResponse.mainVariant?.width ?? "",
            height: productResponse.mainVariant?.height ?? "",
            onPromotion: Boolean(productResponse.mainVariant?.onPromotion),
            salePrice: productResponse.mainVariant?.salePrice ?? "",
            discountPercent: productResponse.mainVariant?.discountPercent ?? "",
            attributes: normalizeAttributesObjectToArray(productResponse.mainVariant?.attributes),
          },
          variants: (productResponse.productVariants || []).map((v) => ({
            _id: v._id,
            _localId: createLocalId(),
            sku: v.sku || "",
            price: v.price ?? "",
            stock: v.stock ?? "",
            imageUrl: v.imageUrl || "",
            datasheet: v.datasheet || "",
            weight: v.weight ?? "",
            length: v.length ?? "",
            width: v.width ?? "",
            height: v.height ?? "",
            onPromotion: Boolean(v.onPromotion),
            salePrice: v.salePrice ?? "",
            discountPercent: v.discountPercent ?? "",
            attributes: normalizeAttributesObjectToArray(v.attributes),
          })),
        });
      } catch (error) {
        toast.error("Falha ao carregar produto");
        router.push("/seller/products");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId, router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Nome do produto é obrigatório";
    if (!formData.description.trim()) newErrors.description = "Descrição é obrigatória";
    if (!formData.category) newErrors.category = "Categoria é obrigatória";
    if (!formData.mainVariant.sku.trim()) newErrors.mainVariantSku = "SKU da variante principal é obrigatório";
    if (formData.mainVariant.price <= 0) newErrors.mainVariantPrice = "Preço deve ser maior que 0";
    if (formData.mainVariant.stock < 0) newErrors.mainVariantStock = "Estoque não pode ser negativo";
    if (formData.maxPerPerson !== "" && Number(formData.maxPerPerson) < 1) {
      newErrors.maxPerPerson = "Limite máximo deve ser ao menos 1";
    }
    if (
      formData.maxPerPerson !== "" &&
      formData.mainVariant.stock !== "" &&
      Number(formData.maxPerPerson) > Number(formData.mainVariant.stock)
    ) {
      newErrors.maxPerPerson = "O limite máximo por pessoa não pode ser maior que o estoque";
    }

    // Validar atributos
    formData.mainVariant.attributes.forEach((attr, idx) => {
      if (!attr.name.trim()) newErrors[`mainAttrName${idx}`] = "Nome do atributo não pode estar vazio";
      if (!attr.value.trim()) newErrors[`mainAttrValue${idx}`] = "Valor do atributo não pode estar vazio";
    });

    formData.variants.forEach((variant, vidx) => {
      if (!variant.sku.trim()) newErrors[`variantSku${vidx}`] = "SKU é obrigatório";
      if (variant.price <= 0) newErrors[`variantPrice${vidx}`] = "Preço deve ser maior que 0";
      if (variant.stock < 0) newErrors[`variantStock${vidx}`] = "Estoque não pode ser negativo";

      variant.attributes.forEach((attr, aidx) => {
        if (!attr.name.trim()) newErrors[`variantAttrName${vidx}${aidx}`] = "Nome do atributo não pode estar vazio";
        if (!attr.value.trim()) newErrors[`variantAttrValue${vidx}${aidx}`] = "Valor do atributo não pode estar vazio";
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Preencha todos os campos obrigatórios corretamente");
      return;
    }

    setIsSaving(true);
    try {
      const convertedMainVariant = createVariantPayload(formData.mainVariant);
      const convertedVariants = formData.variants.map((variant) => createVariantPayload(variant));

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        highlighted: Boolean(formData.highlighted),
        maxPerPerson: formData.maxPerPerson === "" ? null : Number(formData.maxPerPerson),
        status: formData.status,
        mainVariant: convertedMainVariant,
        variants: convertedVariants,
        removeVariantIds: removedVariantIds,
      };

      await storeService.updateProduct(productId, payload);
      toast.success("Produto atualizado com sucesso!");
      setRemovedVariantIds([]);
      router.push("/seller/products");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao atualizar produto");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-4xl flex items-center justify-center min-h-96">
          <div className="flex items-center gap-2 text-slate-600">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando produto...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/seller/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar produto</h1>
            <p className="text-sm text-slate-600 mt-1">Atualize os detalhes e variações do seu produto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Nome, descrição e categoria do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome do Produto *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Camiseta de Algodão Premium"
                  className={`text-sm ${errors.name ? "border-rose-500" : ""}`}
                />
                {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva os principais características do produto..."
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? "border-rose-500" : "border-slate-300"
                  }`}
                />
                {errors.description && <p className="text-xs text-rose-600">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Categoria *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full h-9 px-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? "border-rose-500" : "border-slate-300"
                  }`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-rose-600">{errors.category}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border self-end border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.highlighted)}
                    onChange={(e) => setFormData({ ...formData, highlighted: e.target.checked })}
                  />
                  Produto em destaque
                </label>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Limite máximo por pessoa</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxPerPerson}
                    onChange={(e) => setFormData({ ...formData, maxPerPerson: e.target.value })}
                    placeholder="Opcional"
                    className={`text-sm ${errors.maxPerPerson ? "border-rose-500" : ""}`}
                  />
                  {errors.maxPerPerson && <p className="text-xs text-rose-600">{errors.maxPerPerson}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 px-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
                  >
                    <option value="active">Ativo</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variante Principal */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Variantes</h2>
            <p className="text-sm text-slate-600">Configure a variante principal e adicione variações adicionais</p>
          </div>

          <VariantSection
            variant={formData.mainVariant}
            displayIndex={0}
            onUpdate={(updated) => setFormData({ ...formData, mainVariant: updated })}
            onRemove={() => {}}
            isMainVariant={true}
          />

          {/* Variantes Adicionais */}
          {formData.variants.length > 0 && (
            <div className="space-y-3">
              {formData.variants.map((variant, idx) => (
                <VariantSection
                  key={variant._localId}
                  variant={variant}
                  displayIndex={idx + 1}
                  onUpdate={(updated) => {
                    const newVariants = [...formData.variants];
                    newVariants[idx] = { ...updated, _localId: variant._localId, _id: variant._id };
                    setFormData({ ...formData, variants: newVariants });
                  }}
                  onRemove={() => {
                    // Rastrear ID da variante deletada se ela já existe no banco
                    if (formData.variants[idx]._id) {
                      setRemovedVariantIds([...removedVariantIds, formData.variants[idx]._id]);
                    }
                    const newVariants = formData.variants.filter((_, i) => i !== idx);
                    setFormData({ ...formData, variants: newVariants });
                  }}
                  isMainVariant={false}
                />
              ))}
            </div>
          )}

          {/* Adicionar Variante */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              setFormData({
                ...formData,
                variants: [
                  ...formData.variants,
                  {
                    _localId: createLocalId(),
                    sku: "",
                    price: "",
                    stock: "",
                    imageUrl: "",
                    datasheet: "",
                    weight: "",
                    length: "",
                    width: "",
                    height: "",
                    onPromotion: false,
                    salePrice: "",
                    discountPercent: "",
                    attributes: [],
                  },
                ],
              });
            }}
          >
            <Plus className="h-4 w-4" /> Adicionar variante
          </Button>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/seller/products">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
              {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
