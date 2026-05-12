"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  MapPin,
  Package,
  ChevronDown,
  Bell,
  Star,
  Heart,
  Headset,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/api/api";
import { removeFrontendCookie } from "@/utils/cookies";
import { storeService } from "@/services/storeService";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";

export function Header({
  initialLocation = "Descobrir sua região",
  isUserLoggedIn = false,
  userName = null,
  userRole = null,
}) {
  const router = useRouter();

  const [location, setLocation] = useState(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStore, setHasStore] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const saveLocationCookie = (newLocation) => {
    const safeLocation = encodeURIComponent(newLocation);
    document.cookie = `@tanamao:location=${safeLocation}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchByIP = async () => {
      if (initialLocation !== "Descobrir sua região") return;

      try {
        const response = await fetch("https://ipinfo.io/json");
        if (!response.ok) throw new Error();
        const data = await response.json();

        if (data.city && isMounted) {
          const newLocation = `${data.city} e região`;
          setLocation(newLocation);
          saveLocationCookie(newLocation);
        }
      } catch (error) {}
    };

    fetchByIP();
    return () => {
      isMounted = false;
    };
  }, [initialLocation]);

  useEffect(() => {
    let isMounted = true;

    const loadStoreStatus = async () => {
      if (!isUserLoggedIn) {
        if (isMounted) {
          setHasStore(false);
        }
        return;
      }

      try {
        const store = await storeService.getMyStore();
        if (isMounted) {
          setHasStore(Boolean(store));
        }
      } catch (error) {
        const status = error?.response?.status;
        const code = error?.response?.data?.code;

        if (status === 404 || code === "STORE_NOT_FOUND") {
          if (isMounted) {
            setHasStore(false);
          }
          return;
        }

        if (isMounted) {
          setHasStore(false);
        }
      }
    };

    loadStoreStatus();

    return () => {
      isMounted = false;
    };
  }, [isUserLoggedIn]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const payload = await res.json();

        let items = [];
        if (Array.isArray(payload)) {
          items = payload;
        } else if (Array.isArray(payload.data)) {
          items = payload.data;
        } else if (Array.isArray(payload.data?.items)) {
          items = payload.data.items;
        } else {
          items = [];
        }

        if (mounted) setCategories(items);
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  const handleLocationClick = () => {
    setIsLoading(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await res.json();
            const city = data.address.city || data.address.town || "Sua região";

            const newLocation = `${city} e região`;
            setLocation(newLocation);
            saveLocationCookie(newLocation);
          } catch (e) {}

          router.push(`/produtos-perto-de-mim?lat=${latitude}&lon=${longitude}`);
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
          router.push("/produtos-perto-de-mim");
        },
      );
    } else {
      router.push("/produtos-perto-de-mim");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao deslogar no backend", error);
    } finally {
      removeFrontendCookie("userName");
      removeFrontendCookie("userRole");
      window.location.reload();
    }
  };

  const firstLetter = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <header className="w-full bg-[#1a4f9c] px-4 py-3 pt-5 text-white shadow-md md:py-4">
      <div className="mx-auto relative flex max-w-7xl flex-col gap-3">
        <div className="flex justify-center lg:justify-start lg:absolute lg:left-3.75 lg:top-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-1 font-extrabold tracking-tighter md:text-2xl">
            <span className="text-white">Tána</span>
            <span className="rounded-sm bg-yellow-400 px-1 text-blue-900">Mão!</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 min-h-12.5 lg:pl-40">
          <div className="relative min-w-0 flex-1 lg:pr-3">
            <Input
              className="h-10 w-full border-none bg-white pl-4 pr-10 text-zinc-800 shadow-inner focus-visible:ring-2 focus-visible:ring-yellow-400"
              placeholder="O que você precisa hoje? Tá na mão!..."
            />
            <div className="absolute right-3 lg:right-6 top-2.5 border-l pl-2 text-zinc-400">
              <Search size={20} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium hover:bg-white/15 lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            {isUserLoggedIn ? (
              <div className="relative group flex items-center gap-2 pl-2 text-sm font-medium">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 font-extrabold text-blue-900 shadow-inner transition-transform group-hover:scale-105">
                  {firstLetter}
                </div>

                <div className="flex items-center gap-1 transition-colors group-hover:text-yellow-400">
                  <span className="max-w-25 truncate font-bold">{userName}</span>
                  <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
                </div>

                <div className="invisible absolute right-0 top-full z-50 w-56 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="absolute left-0 top-0 h-3 w-full bg-transparent" />

                  <div className="flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-white text-slate-700 shadow-xl">
                    <div className="mb-1 border-b border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-light text-slate-500">User:</p>
                      <p className="truncate text-sm font-bold text-slate-800">{userName}</p>
                    </div>

                    {hasStore && (
                      <Link
                        href="/seller"
                        className="flex items-center gap-3 px-4 py-2.5 font-medium transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Package size={16} className="text-slate-400" /> Minha Loja
                      </Link>
                    )}

                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <User size={16} className="text-slate-400" /> Perfil
                    </Link>

                    <Link
                      href="/pedidos"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Package size={16} className="text-slate-400" /> Pedidos
                    </Link>

                    <Link
                      href="/avaliacoes"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Star size={16} className="text-slate-400" /> Avaliações
                    </Link>

                    <Link
                      href="/favoritos"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Heart size={16} className="text-slate-400" /> Favoritos
                    </Link>

                    <Link
                      href="/notificacoes"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Bell size={16} className="text-slate-400" /> Notificações
                    </Link>

                    <Link
                      href="/suporte"
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Headset size={16} className="text-slate-400" /> Suporte
                    </Link>

                    <hr className="my-1 border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={16} /> Deslogar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm font-medium">
                <Link href="/login" className="flex items-center gap-2 transition-colors hover:text-yellow-400">
                  <div className="rounded-full bg-white/20 p-2">
                    <User size={18} />
                  </div>
                  <span>Olá, entre aqui!</span>
                </Link>

                <Link
                  href="/signup"
                  className="relative flex items-center gap-1 rounded-md px-2 py-2 transition-colors hover:text-yellow-400"
                >
                  <div className="rounded-full bg-white/20 p-2">
                    <Plus size={18} />
                  </div>
                  <div className="grid place-items-start">
                    <span className="text-[11px]">Novo aqui?</span>
                    <span className="rounded-2xl bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-blue-900 transition-colors group-hover:bg-blue-900 group-hover:text-yellow-400">
                      Crie sua Conta
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
          <div className="shrink-0">
            <CartButton />
          </div>
        </div>

        <div
          className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 lg:hidden ${
            mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          <div
            className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="pointer-events-none absolute inset-y-0 right-0 flex max-w-full pl-4">
            <div
              className={`pointer-events-auto w-screen max-w-sm transform transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex h-full flex-col bg-white text-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h3 className="text-lg font-semibold">Menu</h3>
                  <button onClick={() => setMobileMenuOpen(false)} className="rounded-md p-1 text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <nav className="grid gap-2">
                    {isUserLoggedIn ? (
                      <>
                        <Link
                          href="/perfil"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Perfil
                        </Link>
                        <Link
                          href="/pedidos"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Pedidos
                        </Link>
                        <Link
                          href="/avaliacoes"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Avaliações
                        </Link>
                        <Link
                          href="/favoritos"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Favoritos
                        </Link>
                        <Link
                          href="/suporte"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Suporte
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full rounded-lg bg-rose-50 px-3 py-2 text-left text-rose-600"
                        >
                          Deslogar
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Entrar
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                        >
                          Criar conta
                        </Link>
                      </>
                    )}

                    <div className="mt-2 border-t border-slate-100 pt-3">
                      <h4 className="mb-2 px-1 text-sm font-medium">Categorias</h4>
                      <div className="grid gap-1">
                        {categories && categories.length > 0 ? (
                          categories.map((cat) => (
                            <Link
                              key={cat._id || cat.id || cat.slug}
                              href={cat.slug ? `/categorias/${cat.slug}` : `/categorias?id=${cat._id || cat.id}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded px-2 py-2 hover:bg-slate-50"
                            >
                              {cat.name}
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">Nenhuma categoria</p>
                        )}
                      </div>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-light text-blue-50/90 md:text-sm">
          <button
            onClick={handleLocationClick}
            disabled={isLoading}
            className="hidden items-center gap-1 rounded-full border border-blue-400/30 bg-blue-800/40 px-3 py-1.5 text-white font-medium transition-all hover:bg-blue-700/60 active:scale-95 disabled:opacity-50 sm:inline-flex"
          >
            <MapPin size={14} className={`${isLoading ? "animate-bounce" : ""} text-yellow-400`} />
            <span>{isLoading ? "Buscando..." : location}</span>
          </button>

          <div
            className="relative hidden sm:inline-block"
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              setIsCategoriesOpen(true);
            }}
            onMouseLeave={() => {
              if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = setTimeout(() => {
                setIsCategoriesOpen(false);
                closeTimeoutRef.current = null;
              }, 180);
            }}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/15"
              aria-expanded={isCategoriesOpen}
            >
              <ChevronDown size={14} />
              Categorias
            </button>

            <div
              className={`absolute left-0 z-2000 mt-2 w-56 rounded-lg bg-white text-slate-800 shadow-lg border border-slate-100 transition-opacity ${
                isCategoriesOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <div className="p-2">
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link
                      key={cat._id || cat.id || cat.slug}
                      href={cat.slug ? `/categorias/${cat.slug}` : `/categorias?id=${cat._id || cat.id}`}
                      className="block rounded px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      {cat.name}
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">Nenhuma categoria</div>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/ofertas"
            className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/15 sm:inline-flex"
          >
            Ofertas do Dia
          </Link>

          <Link
            href="/mais-vendidos"
            className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/15 md:inline-flex"
          >
            Mais Vendidos
          </Link>

          <Link
            href={hasStore ? "/seller" : "/seller/onboarding"}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-medium text-white hover:bg-white/15"
          >
            <Package size={14} />
            {hasStore ? "Ver minha loja" : "Seja um vendedor"}
          </Link>
        </div>
      </div>
    </header>
  );
}
