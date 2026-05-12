"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import Link from "next/link";

import { useSignup } from "@/hooks/useAuth";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/";
  const { form, onSubmit: handleSubmit } = useSignup({ redirectTo });
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
    <div className="relative isolate flex min-h-full flex-1 flex-col items-center justify-center bg-[#1a4f9c] p-4 font-sans overflow-hidden">
      <div
        className="absolute z-[-1] top-1/2 left-1/2 -translate-x-1/2
                   w-140 h-140 sm:w-200 sm:h-200
                   rounded-full 
                   bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.7)_0%,rgba(250,204,21,0)_70%)] 
                   blur-[100px] sm:blur-[130px] 
                   pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="mb-1 drop-shadow-lg">
          <Link
            href="/"
            className="font-brand font-extrabold text-4xl tracking-tighter flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <span className="text-white">Tána</span>
            <span className="bg-yellow-400 text-blue-900 px-1.5 rounded-sm shadow-sm">Mão!</span>
          </Link>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-none bg-white">
          <CardHeader className="text-center pb-1 pt-0.5">
            <CardTitle className="text-2xl font-brand font-bold tracking-tight text-[#1a4f9c]">
              Criar uma conta
            </CardTitle>
            <CardDescription className="text-slate-500 font-light">
              Preencha os campos abaixo para criar sua conta.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Nome Completo
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Guilherme Silva"
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Controller
                  name="cpf"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                        CPF
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="Apenas números"
                        maxLength={11}
                        disabled={isLoading}
                        aria-invalid={fieldState.invalid}
                        className="bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="telephone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                        Celular
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="Digite apenas números"
                        maxLength={11}
                        disabled={isLoading}
                        aria-invalid={fieldState.invalid}
                        className="bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#1a4f9c]"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Senha
                    </FieldLabel>
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

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name} className="text-slate-700 font-medium">
                      Confirmar Senha
                    </FieldLabel>
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
                className="w-full cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-blue-900 font-bold mt-4 h-11 transition-all active:scale-95 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Validando credenciais..." : "Cadastrar"}
              </Button>

              <div className="text-center mt-2 text-sm text-slate-600 py-1">
                Já é chegado do TánaMão?{" "}
                <Link href="/login" className="text-[#1a4f9c] font-bold hover:underline">
                  Faça o login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
