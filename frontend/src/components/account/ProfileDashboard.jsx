"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Heart, Package, PencilLine, RefreshCw, Star, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AccountEmptyState,
  AccountPageHero,
  AccountSectionCard,
  AccountStatGrid,
  getToneClass,
} from "./AccountPrimitives";
import { profileService } from "@/services/profileService";
import { formatDateOnly } from "@/lib/formatters";
import { getFrontendCookie } from "@/utils/cookies";
import { EditProfileDialog } from "./EditProfileDialog";
import { AddressManagement } from "./AddressManagement";
import { PaymentMethodManagement } from "./PaymentMethodManagement";

const QUICK_LINKS = [
  { href: "/pedidos", label: "Meus pedidos", icon: Package, helper: "Histórico e status" },
  { href: "/avaliacoes", label: "Minhas avaliações", icon: Star, helper: "Notas e comentários" },
  { href: "/favoritos", label: "Favoritos", icon: Heart, helper: "Produtos salvos" },
  { href: "/notificacoes", label: "Notificações", icon: Bell, helper: "Alertas e atualizações" },
];

export default function ProfileDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await profileService.getMyProfile();

        if (!mounted) return;
        setProfile(data);
      } catch (err) {
        if (!mounted) return;

        const message = err?.response?.data?.message || "Não foi possível carregar seu perfil.";
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const fallbackName = getFrontendCookie("userName") || "Usuário";
  const user = useMemo(
    () => profile?.user ?? { name: fallbackName, email: null, role: null, cpf: null, telephone: null },
    [profile?.user, fallbackName],
  );
  const summary = useMemo(() => profile?.summary ?? {}, [profile?.summary]);
  const store = useMemo(() => profile?.store ?? null, [profile?.store]);

  const stats = useMemo(
    () => [
      { label: "Pedidos", value: summary.orders ?? 0, helper: `${summary.pendingOrders ?? 0} pendente(s)` },
      { label: "Reviews", value: summary.reviews ?? 0, helper: "Feitas pelo cliente" },
      { label: "Favoritos", value: summary.favorites ?? 0, helper: "Produtos salvos" },
      {
        label: "Notificações",
        value: summary.unreadNotifications ?? 0,
        helper: `${summary.notifications ?? 0} no total`,
      },
    ],
    [summary],
  );

  const handleSaveProfile = async (payload) => {
    try {
      await profileService.updateMyProfile(payload);
      toast.success("Perfil atualizado com sucesso");
      setIsEditDialogOpen(false);
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao atualizar perfil");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-56 rounded-[28px] bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-2xl bg-white" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="h-72 rounded-2xl bg-white" />
            <div className="h-72 rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          <AccountEmptyState
            title="Não foi possível carregar seu perfil"
            description={error}
            actionLabel="Tentar novamente"
            onAction={() => window.location.reload()}
            icon={RefreshCw}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AccountPageHero
          eyebrow="Sua conta"
          title={`Olá, ${user.name}`}
          description="Acompanhe seu histórico, atalhos e o estado da sua conta em uma visão clara e organizada."
          actions={
            <>
              <Button asChild variant="secondary">
                <Link href="/pedidos">Ver pedidos</Link>
              </Button>

              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <PencilLine className="h-4 w-4" />
                Editar perfil
              </Button>

              <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                <Link href="/notificacoes">Abrir notificações</Link>
              </Button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-sm md:col-span-2">
              <CardContent className="space-y-3 p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                  <span className={getToneClass("info") + " rounded-full px-3 py-1 text-xs font-semibold"}>
                    {user.role === "seller" ? "Seller" : user.role === "admin" ? "Admin" : "Cliente"}
                  </span>
                  <span className={getToneClass("success") + " rounded-full px-3 py-1 text-xs font-semibold"}>
                    {summary.unreadNotifications ?? 0} notificação(ões) pendente(s)
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-300">E-mail</div>
                    <div className="mt-1 font-semibold">{user.email || "Não informado"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-300">Telefone</div>
                    <div className="mt-1 font-semibold">{user.telephone || "Não informado"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-300">CPF</div>
                    <div className="mt-1 font-semibold">{user.cpf || "Não informado"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-300">Conta criada em</div>
                    <div className="mt-1 font-semibold">{formatDateOnly(user.createdAt)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-sm">
              <CardContent className="space-y-3 p-4 md:p-5">
                <div className="flex items-center gap-2 text-slate-200">
                  <UserRound className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-semibold">Resumo da conta</span>
                </div>
                <div className="space-y-2 text-sm text-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <span className="font-semibold">{user.status || "active"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Endereços</span>
                    <span className="font-semibold">{summary.addresses ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Meios de pagamento</span>
                    <span className="font-semibold">{summary.paymentMethods ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AccountPageHero>

        <AccountStatGrid stats={stats} />

        <div className="grid gap-4 xl:grid-cols-3">
          {/* }
          <AccountSectionCard title="Meu perfil" description="Revise seus dados básicos e faça ajustes rápidos.">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Nome</div>
                  <div className="mt-1 font-semibold text-slate-950">{user.name}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">E-mail</div>
                  <div className="mt-1 font-semibold text-slate-950">{user.email || "Não informado"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Telefone</div>
                  <div className="mt-1 font-semibold text-slate-950">{user.telephone || "Não informado"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">CPF</div>
                  <div className="mt-1 font-semibold text-slate-950">{user.cpf || "Não informado"}</div>
                </div>
              </div>

              <Button className="w-full" onClick={() => setIsEditDialogOpen(true)}>
                <PencilLine className="h-4 w-4" />
                Editar dados da conta
              </Button>
            </div>
          </AccountSectionCard>
            {*/}
          <AddressManagement />
          <PaymentMethodManagement />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <AccountSectionCard
            title="Atalhos rápidos"
            description="Acesse as áreas mais importantes da sua conta com um clique."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white p-2 text-blue-700 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-950">{link.label}</div>
                        <div className="text-sm text-slate-600">{link.helper}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </AccountSectionCard>

          <AccountSectionCard
            title="Minha operação"
            description="Dados adicionais da conta, incluindo loja e estrutura de consumo."
          >
            {store ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2 text-blue-700 shadow-sm ring-1 ring-slate-200">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-950">{store.name}</div>
                      <div className="text-sm text-slate-600">/{store.slug}</div>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href="/seller">Abrir área do seller</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Seu perfil está pronto para uso como cliente. Se quiser vender, complete o onboarding da loja.
                </p>
                <Button asChild className="w-full">
                  <Link href="/seller/onboarding">Começar onboarding de seller</Link>
                </Button>
              </div>
            )}
          </AccountSectionCard>
        </div>

        <EditProfileDialog
          user={user}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveProfile}
        />
      </div>
    </main>
  );
}
