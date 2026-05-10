"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import Link from "next/link";

import { useLogin } from "@/hooks/useAuth";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/";
  const { form, onSubmit: handleSubmit } = useLogin({ redirectTo });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await handleSubmit(values);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-[calc(100vh-130px)] flex-col items-center justify-center bg-[#1a4f9c] p-4 font-sans overflow-hidden">
      <div
        className="absolute z-[-1] top-1/2 left-1/2 -translate-x-1/2
                   w-140 h-140 sm:w-200 sm:h-200
                   rounded-full 
                   bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.7)_0%,rgba(250,204,21,0)_70%)] 
                   blur-[100px] sm:blur-[130px] 
                   pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center w-full -mt-5">
        <div className="mb-2 drop-shadow-lg">
          <Link
            href="/"
            className="font-brand font-extrabold text-4xl tracking-tighter flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <span className="text-white">Tána</span>
            <span className="bg-yellow-400 text-blue-900 px-1.5 rounded-sm shadow-sm">Mão!</span>
          </Link>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-none bg-white">
          <CardHeader className="space-y-2 text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-brand font-bold tracking-tight text-[#1a4f9c]">
              Entrar na sua conta
            </CardTitle>
            <CardDescription className="text-slate-500 font-light">
              Introduza as suas credenciais para acessar o marketplace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      E-mail
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="exemplo@email.com"
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                        Senha
                      </FieldLabel>
                      <Link
                        href="/esqueci-a-senha"
                        className="text-xs text-blue-600 hover:text-[#1a4f9c] hover:underline font-medium"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="w-full cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-blue-900 font-bold mt-6 h-11 transition-all active:scale-95 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Validando credenciais..." : "Entrar"}
              </Button>

              <div className="text-center mt-6 text-sm text-slate-600 pb-2">
                Novo no TánaMão?{" "}
                <Link href="/signup" className="text-[#1a4f9c] font-bold hover:underline">
                  Crie sua conta
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
