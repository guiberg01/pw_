"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Grid, LoaderCircle, ArrowLeft, Edit, Trash2 } from "lucide-react";

import { categoryService } from "@/services/categoryService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await categoryService.getAllForAdmin();
          setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
          toast.error("Falha ao carregar categorias");
          setCategories([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
    });
    setEditingId(category._id);
    setShowDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon.trim() || undefined,
      };

      if (editingId) {
        const updated = await categoryService.update(editingId, payload);
        setCategories((prev) => prev.map((c) => (c._id === editingId ? { ...c, ...updated } : c)));
        toast.success("Categoria atualizada com sucesso!");
      } else {
        const newCategory = await categoryService.create(payload);
        setCategories((prev) => [newCategory, ...prev]);
        toast.success("Categoria criada com sucesso!");
      }

      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar categoria");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setDeletingId(categoryId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await categoryService.delete(deletingId);
      setCategories((prev) => prev.filter((c) => c._id !== deletingId));
      toast.success("Categoria deletada com sucesso!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Ocorreu um erro ao deletar a categoria. Verifique se tem produtos associados.",
      );
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  return (
    <main className="h-full min-h-0 w-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-slate-950 text-white shadow-2xl shadow-slate-300/40">
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.25),rgba(15,23,42,0.55)_45%,rgba(34,197,94,0.18))]" />
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100 backdrop-blur-sm">
                <Grid className="h-4 w-4" />
                Categorias
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">Gerenciador de Categorias</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  Crie e organize as categorias de produtos do marketplace.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={openCreateDialog} className="bg-yellow-400 text-slate-950 hover:bg-yellow-500">
                  <Plus className="h-4 w-4" />
                  Nova Categoria
                </Button>
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
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-slate-950">Todas as Categorias</CardTitle>
            <p className="text-sm text-slate-500">Total: {categories.length} categorias</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#1a4f9c] mb-4" />
                <p>Carregando categorias...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Grid className="h-12 w-12 text-slate-300 mb-4" />
                <p>Nenhuma categoria encontrada. Crie uma para começar!</p>
              </div>
            ) : (
              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    {category.icon && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl">
                        {category.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-950">{category.name}</h3>
                      {category.description && (
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(category)} className="flex-1">
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 flex-1"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Categoria" : "Criar Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados da categoria." : "Preencha os dados para criar uma nova categoria."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel>Nome da Categoria *</FieldLabel>
              <Input name="name" placeholder="Ex: Eletrônicos" value={formData.name} onChange={handleInputChange} />
            </Field>

            <Field>
              <FieldLabel>Descrição</FieldLabel>
              <textarea
                name="description"
                placeholder="Ex: Produtos eletrônicos em geral"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full h-24 px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={isCreating}>
              {isCreating ? "Salvando..." : editingId ? "Atualizar" : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title="Deletar Categoria"
        description="Tem certeza que deseja deletar esta categoria? Essa ação não pode ser desfeita."
        confirmLabel="Deletar"
        cancelLabel="Cancelar"
      />
    </main>
  );
}
