"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle, Package, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { categoryService } from "@/services/categoryService";
import { storeService } from "@/services/storeService";
import { uploadService } from "@/services/uploadService";
import { formatCurrency } from "@/lib/utils";

const createLocalId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const createVariantDraft = (overrides = {}) => ({
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
  _localId: createLocalId(),
  ...overrides,
});

const normalizeOptionalNumber = (value) =>
  value === "" || value === null || value === undefined ? null : Number(value);

const serializeVariantForPayload = (variant) => ({
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
  attributes: variant.attributes.reduce((acc, attr) => {
    if (attr.name.trim() && attr.value.trim()) {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {}),
});

const AttributeField = ({ attribute, onChange, onRemove, index }) => {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          placeholder="Nome do atributo"
          value={attribute.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          className="text-sm"
        />
        <Input
          placeholder="Valor"
          value={attribute.value}
          onChange={(e) => onChange(index, "value", e.target.value)}
          className="text-sm"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="text-rose-600 hover:bg-rose-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const VariantSection = ({ variant, displayIndex, onUpdate, onRemove, isMainVariant }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAttributeChange = (attrIndex, field, value) => {
    const updated = { ...variant };
    if (field === "name") {
      updated.attributes[attrIndex].name = value;
    } else if (field === "value") {
      updated.attributes[attrIndex].value = value;
    }
    onUpdate(updated);
  };

  const handleAddAttribute = () => {
    const updated = { ...variant };
    updated.attributes = [...updated.attributes, { name: "", value: "" }];
    onUpdate(updated);
  };

  const handleRemoveAttribute = (attrIndex) => {
    const updated = { ...variant };
    updated.attributes.splice(attrIndex, 1);
    onUpdate(updated);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadService.uploadProductImage(file);
      const imageUrl = response?.imageUrl || response?.url || "";
      const updated = { ...variant, imageUrl };
      onUpdate(updated);
      toast.success("Imagem carregada com sucesso");
    } catch (error) {
      console.error("uploadProductImage error:", error?.response || error);
      toast.error(error?.response?.data?.message || "Falha ao carregar imagem");
    }
  };

  return (
    <Card className="border-slate-200">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
      >
        <div>
          <h3 className="font-semibold text-slate-900">
            {isMainVariant ? "Variante Principal" : `Variante ${displayIndex}`}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            SKU: {variant.sku} • {formatCurrency(variant.price)} • {variant.stock} un.
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {!isMainVariant && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
          {/* Imagem */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Imagem *</label>
            <div className="flex gap-3">
              {variant.imageUrl && (
                <div className="relative h-24 w-24">
                  <Image src={variant.imageUrl} alt="Variante" fill unoptimized className="rounded-lg object-cover" />
                </div>
              )}
              <label className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="h-5 w-5 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-600">Clique para enviar</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">SKU *</label>
            <Input
              value={variant.sku}
              onChange={(e) => onUpdate({ ...variant, sku: e.target.value })}
              placeholder="Ex: PROD-001-AZUL"
              className="text-sm"
            />
            <p className="text-xs text-slate-500">Identificador único da variante</p>
          </div>

          {/* Preço e Estoque */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Preço (R$) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={variant.price === "" ? "" : variant.price}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, price: v === "" ? "" : parseFloat(v) });
                }}
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Estoque (unidades) *</label>
              <Input
                type="number"
                min="0"
                value={variant.stock === "" ? "" : variant.stock}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, stock: v === "" ? "" : parseInt(v) });
                }}
                placeholder="0"
                className="text-sm"
              />
            </div>
          </div>

          {/* Dados complementares */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Ficha técnica (opcional)</label>
              <Input
                value={variant.datasheet ?? ""}
                onChange={(e) => onUpdate({ ...variant, datasheet: e.target.value })}
                placeholder="URL ou referência da ficha técnica"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Peso</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={variant.weight === "" ? "" : variant.weight}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, weight: v === "" ? "" : Number(v) });
                }}
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Comprimento</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={variant.length === "" ? "" : variant.length}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, length: v === "" ? "" : Number(v) });
                }}
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Largura</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={variant.width === "" ? "" : variant.width}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, width: v === "" ? "" : Number(v) });
                }}
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Altura</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={variant.height === "" ? "" : variant.height}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, height: v === "" ? "" : Number(v) });
                }}
                placeholder="0.00"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center self-end gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(variant.onPromotion)}
                onChange={(e) => onUpdate({ ...variant, onPromotion: e.target.checked })}
              />
              Em promoção
            </label>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Preço promocional</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={variant.salePrice === "" ? "" : variant.salePrice}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, salePrice: v === "" ? "" : Number(v) });
                }}
                placeholder="0.00"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Desconto (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={variant.discountPercent === "" ? "" : variant.discountPercent}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdate({ ...variant, discountPercent: v === "" ? "" : Number(v) });
                }}
                placeholder="0"
                className="text-sm"
              />
            </div>
          </div>

          {/* Atributos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Atributos (opcional)</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAttribute} className="gap-1">
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {variant.attributes.map((attr, attrIdx) => (
                <AttributeField
                  key={attrIdx}
                  attribute={attr}
                  onChange={handleAttributeChange}
                  onRemove={handleRemoveAttribute}
                  index={attrIdx}
                />
              ))}
            </div>

            <p className="text-xs text-slate-500">Ex: Cor: Azul, Tamanho: M.</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default function CreateProductPage() {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    highlighted: false,
    maxPerPerson: "",
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

  // Carregar categorias
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Nome do produto é obrigatório";
    if (!formData.description.trim()) newErrors.description = "Descrição é obrigatória";
    if (!formData.category) newErrors.category = "Categoria é obrigatória";
    if (!formData.mainVariant.sku.trim()) newErrors.mainVariantSku = "SKU da variante principal é obrigatório";
    if (!formData.mainVariant.imageUrl) newErrors.mainVariantImage = "Imagem da variante principal é obrigatória";
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
      if (!variant.imageUrl) newErrors[`variantImage${vidx}`] = "Imagem é obrigatória";
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
      const convertedMainVariant = serializeVariantForPayload(formData.mainVariant);
      const convertedVariants = formData.variants.map((variant) => serializeVariantForPayload(variant));

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        highlighted: Boolean(formData.highlighted),
        maxPerPerson: formData.maxPerPerson === "" ? null : Number(formData.maxPerPerson),
        mainVariant: convertedMainVariant,
        variants: convertedVariants,
      };

      await storeService.createMyStoreProduct(payload);
      toast.success("Produto criado com sucesso!");
      router.push("/seller/products");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Falha ao criar produto");
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900">Criar novo produto</h1>
            <p className="text-sm text-slate-600 mt-1">Preencha os detalhes e variações do seu produto</p>
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
            </CardContent>
          </Card>

          {/* Variante Principal */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Variantes</h2>
            <p className="text-sm text-slate-600">
              Configure a variante principal e adicione variações adicionais (clique na variante para expandir)
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do Produto</CardTitle>
              <CardDescription>Campos globais para seu produto</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center self-end gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.highlighted)}
                  onChange={(e) => setFormData({ ...formData, highlighted: e.target.checked })}
                />
                Produto em destaque na página da loja?
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
            </CardContent>
          </Card>

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
                    newVariants[idx] = { ...updated, _localId: variant._localId };
                    setFormData({ ...formData, variants: newVariants });
                  }}
                  onRemove={() => {
                    const newVariants = formData.variants.filter((item) => item._localId !== variant._localId);
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
                variants: [...formData.variants, createVariantDraft()],
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
              {isSaving ? "Criando..." : "Criar produto"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
