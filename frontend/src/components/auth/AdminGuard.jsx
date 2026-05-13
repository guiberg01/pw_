"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { api } from "@/api/api";

export function AdminGuard({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        await api.get("/admin/summary");

        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);

        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <LoaderCircle className="h-10 w-10 animate-spin text-[#1a4f9c]" />
        <p className="mt-4 text-slate-600 font-medium font-sans">Verificando permissões...</p>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
