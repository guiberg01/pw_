"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/api/api";
import { removeFrontendCookie } from "@/utils/cookies";
import { storeService } from "@/services/storeService";
import Link from "next/link";

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
    <header className="w-full bg-[#1a4f9c] py-3 px-4 shadow-md pt-5 text-white min-h-32.5">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        <div className="flex justify-center items-center gap-4 lg:gap-8">
          <Link href="/" className="font-extrabold text-2xl tracking-tighter shrink-0 flex items-center gap-1">
            <span className="text-white">Tána</span>
            <span className="bg-yellow-400 text-blue-900 px-1 rounded-sm">Mão!</span>
          </Link>

          <div className="relative flex-1 max-w-2xl">
            <Input
              className="w-full bg-white text-zinc-800 border-none shadow-inner h-9 pl-4 pr-10 focus-visible:ring-2 focus-visible:ring-yellow-400"
              placeholder="O que você precisa hoje? Tá na mão!..."
            />
            <div className="absolute right-3 top-2 text-zinc-400 border-l pl-2">
              <Search size={20} />
            </div>
          </div>

          {isUserLoggedIn ? (
            <div className="hidden relative md:flex items-center gap-5 text-sm font-medium max-lg:after:-left-0.5 after:content-[''] after:absolute after:-left-2 after:w-px after:h-full after:bg-white/20">
              <div className="relative group cursor-pointer flex items-center gap-2 pl-2">
                <div className="bg-yellow-400 text-blue-900 font-extrabold w-9 h-9 rounded-full flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
                  {firstLetter}
                </div>

                <div className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
                  <span className="max-w-25 truncate font-bold">{userName}</span>
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </div>

                <div className="absolute top-full right-0 pt-3 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="absolute top-0 left-0 w-full h-3 bg-transparent"></div>

                  <div className="bg-white rounded-lg shadow-xl border border-slate-100 text-slate-700 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-500 font-light">User: </p>
                      <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                    </div>

                    {hasStore && (
                      <Link
                        href="/seller"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                      >
                        <Package size={16} className="text-slate-400" /> Minha Loja
                      </Link>
                    )}

                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <User size={16} className="text-slate-400" /> Perfil
                    </Link>

                    <Link
                      href="/pedidos"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Package size={16} className="text-slate-400" /> Pedidos
                    </Link>

                    <Link
                      href="/avaliacoes"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Star size={16} className="text-slate-400" /> Avaliações
                    </Link>

                    <Link
                      href="/favoritos"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Heart size={16} className="text-slate-400" /> Favoritos
                    </Link>

                    <Link
                      href="/suporte"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Headset size={16} className="text-slate-400" /> Suporte
                    </Link>

                    <hr className="my-1 border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 w-full text-left transition-colors font-medium"
                    >
                      <LogOut size={16} /> Deslogar
                    </button>
                  </div>
                </div>
              </div>

              <Link href="#" className="relative hover:text-yellow-400 transition-colors">
                <ShoppingCart size={24} />
                <span className="absolute -top-1 -right-2 bg-yellow-400 text-blue-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#1a4f9c]">
                  0
                </span>
              </Link>

              <button className="relative hover:text-yellow-400 transition-colors cursor-pointer">
                <Bell size={22} className="animate-pulse" />
                <span className="absolute -top-1 -right-2 bg-yellow-400 text-blue-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#1a4f9c]">
                  0
                </span>
              </button>
            </div>
          ) : (
            <div className="hidden relative md:flex items-center gap-5 text-sm font-medium max-lg:after:-left-2 after:content-[''] after:absolute after:-left-3 after:w-px after:h-9 after:bg-white/20">
              <Link href="/login" className="flex items-center gap-2 hover:text-yellow-400 transition-colors">
                <div className="bg-white/20 p-2 rounded-full">
                  <User size={18} />
                </div>
                <span>Olá, entre aqui!</span>
              </Link>

              <Link
                href="/signup"
                className="relative group hover:text-yellow-400 transition-colors cursor-pointer flex items-center gap-1 p-2 rounded-md"
              >
                <div className="bg-white/20 p-2 rounded-full">
                  <Plus size={18} />
                </div>
                <div className="grid place-items-start">
                  <span className="text-[11px]">Novo aqui?</span>
                  <span className=" bg-yellow-400 transition-colors text-blue-900 text-[10px] font-bold rounded-2xl px-1.5 py-0.5 group-hover:bg-blue-900 group-hover:text-yellow-400">
                    Crie sua Conta
                  </span>
                </div>
              </Link>

              <Link href="#" className="relative hover:text-yellow-400 transition-colors">
                <ShoppingCart size={24} />
                <span className="absolute -top-1 -right-2 bg-yellow-400 text-blue-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#1a4f9c]">
                  0
                </span>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs lg:text-sm font-light text-blue-50/90">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLocationClick}
              disabled={isLoading}
              className="flex items-center cursor-pointer gap-1 text-white font-medium bg-blue-800/40 px-3 py-1 rounded-full border border-blue-400/30 hover:bg-blue-700/60 transition-all active:scale-95 disabled:opacity-50"
            >
              <MapPin size={14} className={`${isLoading ? "animate-bounce" : ""} text-yellow-400`} />
              <span>{isLoading ? "Buscando..." : location}</span>
            </button>
            <nav className="flex gap-4 md:gap-6 items-center">
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-yellow-400 hover:underline group-hover:text-yellow-400 py-2">
                  Categorias
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>

                <div className="absolute top-full left-0 w-60 bg-white rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-slate-700 border border-slate-200 origin-top-left">
                  <div className="absolute -top-2 left-0 w-full h-2 bg-transparent"></div>

                  <div className="py-2 flex flex-col">
                    <Link
                      href="/categorias/informatica"
                      className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      Informática & PC Gamer
                    </Link>
                    <Link
                      href="/categorias/eletronicos"
                      className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      Eletrônicos & Componentes
                    </Link>
                    <Link
                      href="/categorias/games"
                      className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      Games & Consoles
                    </Link>
                    <Link
                      href="/categorias/iot"
                      className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      Casa Inteligente & IoT
                    </Link>
                    <Link
                      href="/categorias/ferramentas"
                      className="px-4 py-2 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium"
                    >
                      Ferramentas & Construção
                    </Link>
                    <hr className="my-1 border-slate-100" />
                    <Link
                      href="/categorias"
                      className="px-4 py-2 hover:bg-slate-50 text-blue-600 transition-colors font-bold text-xs uppercase tracking-wider"
                    >
                      Ver todas as categorias
                    </Link>
                  </div>
                </div>
              </div>

              <Link href="/ofertas" className="hover:text-white hover:underline py-2">
                Ofertas do Dia
              </Link>
              <Link href="/mais-vendidos" className="hover:text-white hover:underline py-2">
                Mais Vendidos
              </Link>
            </nav>
          </div>

          <Link
            href={hasStore ? "/seller" : "/seller/onboarding"}
            className="hidden sm:flex items-center gap-1 hover:text-white hover:underline"
          >
            <Package size={16} />
            {hasStore ? "Ver minha loja" : "Seja um vendedor"}
          </Link>
        </div>
      </div>
    </header>
  );
}
