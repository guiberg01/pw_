"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeImageSrc } from "@/lib/imageUtils";
import { formatCurrency } from "@/lib/utils";
import { uploadService } from "@/services/uploadService";

const AttributeField = ({ attribute, onChange, onRemove, index }) => {
  return (
    <div className="flex items-end gap-2">
      <div className="grid flex-1 grid-cols-2 gap-2">
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

export default function VariantSection({ variant, displayIndex, onUpdate, onRemove, isMainVariant }) {
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
      const updated = { ...variant, imageUrl: response?.imageUrl || response?.url || "" };
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
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
      >
        <div>
          <h3 className="font-semibold text-slate-900">
            {isMainVariant ? "Variante Principal" : `Variante ${displayIndex}`}
          </h3>
          <p className="mt-1 text-xs text-slate-600">
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
        <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Imagem</label>
            <div className="flex gap-3">
              {variant.imageUrl && (
                <div className="relative h-24 w-24">
                  <Image
                    src={normalizeImageSrc(variant.imageUrl)}
                    alt="Variante"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-slate-400">
                <Upload className="mb-2 h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Clique para enviar</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

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

          <div className="grid gap-4 md:grid-cols-2">
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
              <label className="text-sm font-semibold text-slate-700">Peso (kg)</label>
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
              <label className="text-sm font-semibold text-slate-700">Comprimento (cm)</label>
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
              <label className="text-sm font-semibold text-slate-700">Largura (cm)</label>
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
              <label className="text-sm font-semibold text-slate-700">Altura (cm)</label>
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
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
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
}
