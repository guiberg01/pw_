"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bannerService } from "@/services/bannerService";
import { useBannerForm } from "@/hooks/useBannerForm";
import BannerFormModal from "@/components/home/BannerFormModal";
import BannerDeleteModal from "@/components/home/BannerDeleteModal";
import { normalizeImageSrc } from "@/lib/imageUtils";

const getBannerId = (banner) => banner?._id || banner?.id;

const getBannerImage = (banner) =>
  normalizeImageSrc(banner?.imageUrl || "https://placehold.co/1400x480/1a4f9c/ffffff?text=TánaMão");

const bannerFormDefaults = {
  title: "",
  linkUrl: "",
  imageUrl: "",
  displayOrder: 0,
  status: "active",
};

export function BannerSection({ isAdmin = false }) {
  const [publicBanners, setPublicBanners] = useState([]);
  const [adminBanners, setAdminBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoadingPublic, setIsLoadingPublic] = useState(true);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const timerRef = useRef(null);

  const { form } = useBannerForm({
    mode: "create",
    initialData: null,
  });

  const currentBanner = useMemo(() => {
    if (publicBanners.length === 0) return null;
    return publicBanners[activeIndex] || publicBanners[0];
  }, [activeIndex, publicBanners]);

  const fetchPublicBanners = useCallback(() => bannerService.getPublicBanners(), []);

  const fetchAdminBanners = useCallback(() => {
    if (!isAdmin) return Promise.resolve([]);
    return bannerService.getAdminBanners();
  }, [isAdmin]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapBanners = async () => {
      try {
        const [publicItems, adminItems] = await Promise.all([fetchPublicBanners(), fetchAdminBanners()]);

        if (!isMounted) return;

        setPublicBanners(publicItems);
        setAdminBanners(adminItems);
        setActiveIndex(0);
      } finally {
        if (isMounted) {
          setIsLoadingPublic(false);
          setIsLoadingAdmin(false);
        }
      }
    };

    void bootstrapBanners();

    return () => {
      isMounted = false;
    };
  }, [fetchAdminBanners, fetchPublicBanners]);
  const startBannerTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % publicBanners.length);
    }, 6500);
  }, [publicBanners.length]);

  const handleBannerChange = useCallback(
    (indexOrFn) => {
      setActiveIndex((current) => {
        const newIndex = typeof indexOrFn === "function" ? indexOrFn(current) : indexOrFn;
        return newIndex;
      });
      startBannerTimer();
    },
    [startBannerTimer],
  );

  useEffect(() => {
    if (publicBanners.length <= 1) return undefined;

    startBannerTimer();

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [publicBanners.length, startBannerTimer]);

  const openCreateModal = () => {
    setFormMode("create");
    setEditingBanner(null);
    form.reset(bannerFormDefaults);
    setIsFormOpen(true);
  };

  const openEditModal = (banner) => {
    setFormMode("edit");
    setEditingBanner(banner);
    form.reset({
      title: banner.title || "",
      linkUrl: banner.linkUrl || "",
      imageUrl: banner.imageUrl || "",
      displayOrder: banner.displayOrder ?? 0,
      status: banner.status || "active",
    });
    setIsFormOpen(true);
  };

  const openDeleteModal = (banner) => {
    setBannerToDelete(banner);
    setIsDeleteOpen(true);
  };

  const handleFormOpenChange = (open) => {
    setIsFormOpen(open);

    if (!open) {
      form.reset(bannerFormDefaults);
      setEditingBanner(null);
      setFormMode("create");
    }
  };

  const handleDeleteOpenChange = (open) => {
    setIsDeleteOpen(open);

    if (!open) {
      setBannerToDelete(null);
    }
  };

  const refreshBanners = async () => {
    setIsLoadingPublic(true);

    if (isAdmin) {
      setIsLoadingAdmin(true);
    }

    try {
      const [publicItems, adminItems] = await Promise.all([fetchPublicBanners(), fetchAdminBanners()]);

      setPublicBanners(publicItems);
      setAdminBanners(adminItems);
      setActiveIndex(0);
    } finally {
      setIsLoadingPublic(false);
      setIsLoadingAdmin(false);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploadingImage(true);

    try {
      const uploaded = await bannerService.uploadBannerImage(file);

      form.setValue("imageUrl", uploaded.imageUrl, { shouldValidate: true });
      toast.success("Imagem enviada com sucesso");
    } catch (error) {
      console.error("Erro ao enviar imagem do banner:", error);
      toast.error("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmitBanner = async (formData) => {
    setIsSaving(true);

    try {
      if (formMode === "create") {
        await bannerService.createBanner({
          title: formData.title.trim(),
          linkUrl: formData.linkUrl.trim(),
          imageUrl: formData.imageUrl.trim(),
          displayOrder: Number(formData.displayOrder) || 0,
          status: formData.status,
        });
        toast.success("Banner criado com sucesso");
      } else {
        const bannerId = getBannerId(editingBanner);

        await bannerService.updateBanner(bannerId, {
          title: formData.title.trim(),
          linkUrl: formData.linkUrl.trim(),
          imageUrl: formData.imageUrl.trim(),
          displayOrder: Number(formData.displayOrder) || 0,
          status: formData.status,
        });
        toast.success("Banner atualizado com sucesso");
      }

      setIsFormOpen(false);
      setEditingBanner(null);
      await refreshBanners();
    } catch (error) {
      console.error("Erro ao salvar banner:", error);
      const message = error.response?.data?.message || "Não foi possível salvar o banner.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return;

    setIsSaving(true);

    try {
      await bannerService.deleteBanner(getBannerId(bannerToDelete));
      toast.success("Banner removido com sucesso");
      setIsDeleteOpen(false);
      setBannerToDelete(null);
      await refreshBanners();
    } catch (error) {
      console.error("Erro ao excluir banner:", error);
      const message = error.response?.data?.message || "Não foi possível remover o banner.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4 pb-8 bg-slate-200  relative after:content[''] after:hidden after:absolute after:bottom-0 after:left-0 after:h-32 after:w-full after:shadow-[inset_0_-80px_18px_-36px_#f1f5f9]">
      <div className="relative overflow-hidden">
        {isAdmin && (
          <div className="absolute right-4 top-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-white/20 bg-slate-950/35 p-2 text-white shadow-2xl backdrop-blur-md">
            <Button
              variant="outline"
              className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => void refreshBanners()}
            >
              <RefreshCcw size={14} className={isLoadingAdmin ? "animate-spin" : ""} />
              Atualizar
            </Button>
            <Button className="gap-2 bg-yellow-400 text-slate-950 hover:bg-yellow-300" onClick={openCreateModal}>
              <Plus size={14} /> Novo banner
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setIsManageOpen(true)}
            >
              Gerenciar
            </Button>
          </div>
        )}

        {isLoadingPublic ? (
          <div className="grid min-h-55 md:min-h-90 place-items-center bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 animate-pulse rounded-full bg-white/10" />
              <p className="text-sm text-white/70">Carregando banners...</p>
            </div>
          </div>
        ) : currentBanner ? (
          <div className="relative min-h-55 h-[70vh] md:min-h-90">
            <a href={currentBanner.linkUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
              <Image
                src={getBannerImage(currentBanner)}
                alt={currentBanner.title || "Banner promocional"}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1280px"
              />
              <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-900/50 to-transparent" />
              <div className="absolute inset-0 flex items-end p-5 md:items-center md:p-10">
                <div className="max-w-xl text-white">
                  <span className="inline-flex items-center rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.3em] text-blue-950 shadow-sm">
                    Mercado TáNaMão
                  </span>
                  <h3 className="mt-4 text-2xl font-black leading-tight md:text-5xl">{currentBanner.title}</h3>
                  <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">
                    Deslize pelos banners com campanhas em destaque, promoções e vitrines especiais selecionadas pela
                    loja.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                      <ImagePlus size={14} /> Banner #{currentBanner.displayOrder ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur-sm">
                      {currentBanner.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>
            </a>

            {publicBanners.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Banner anterior"
                  onClick={() =>
                    handleBannerChange((current) => (current - 1 + publicBanners.length) % publicBanners.length)
                  }
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg backdrop-blur transition hover:scale-105"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Próximo banner"
                  onClick={() => handleBannerChange((current) => (current + 1) % publicBanners.length)}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-lg backdrop-blur transition hover:scale-105"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {publicBanners.map((banner, index) => (
                  <button
                    key={getBannerId(banner) || `${banner.title}-${index}`}
                    type="button"
                    aria-label={`Ir para banner ${index + 1}`}
                    onClick={() => handleBannerChange(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeIndex ? "w-9 bg-yellow-400" : "w-2.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>

              <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-sm">
                {publicBanners.length} banner{publicBanners.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid min-h-55 place-items-center bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-center text-white md:min-h-90">
            <div className="max-w-md space-y-3">
              <ImagePlus size={30} className="mx-auto text-yellow-400" />
              <h3 className="text-xl font-bold md:text-2xl">Nenhum banner publicado no momento</h3>
              <p className="text-sm text-white/70">
                Assim que o admin cadastrar banners ativos, eles aparecerão aqui, logo abaixo do header.
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gerenciar banners</DialogTitle>
            <DialogDescription>
              Visualize os banners cadastrados e abra os modais de edição ou exclusão.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto pr-1">
            {isLoadingAdmin ? (
              <div className="grid min-h-40 place-items-center text-slate-500">Carregando banners cadastrados...</div>
            ) : adminBanners.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Nenhum banner cadastrado ainda.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {adminBanners.map((banner) => (
                  <div
                    key={getBannerId(banner)}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-16/8 bg-slate-100">
                      <Image
                        src={getBannerImage(banner)}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{banner.title}</p>
                        <p className="mt-1 text-xs text-slate-500 break-all">{banner.linkUrl}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                          Ordem: {banner.displayOrder ?? 0}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${
                            banner.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {banner.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => openEditModal(banner)}>
                          <Pencil size={14} /> Editar
                        </Button>
                        <Button variant="destructive" className="flex-1 gap-2" onClick={() => openDeleteModal(banner)}>
                          <Trash2 size={14} /> Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BannerFormModal
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        form={form}
        formMode={formMode}
        isSaving={isSaving}
        isUploadingImage={isUploadingImage}
        onImageChange={handleImageChange}
        onSubmit={handleSubmitBanner}
      />

      <BannerDeleteModal
        open={isDeleteOpen}
        onOpenChange={handleDeleteOpenChange}
        banner={bannerToDelete}
        isSaving={isSaving}
        onConfirm={handleDeleteBanner}
      />
    </section>
  );
}
