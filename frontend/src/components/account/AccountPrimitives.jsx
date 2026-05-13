"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AccountPageHero({ eyebrow, title, description, actions, children, className }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-bl from-[#1a4f9c] to-blue-900 text-white shadow-[0_20px_80px_rgba(15,23,42,0.22)]",
        className,
      )}
    >
      <div className="relative px-6 py-6 md:px-8 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-yellow-300">{eyebrow}</p>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">{description}</p>
              ) : null}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        {children ? <div className="relative mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

export function AccountStatGrid({ stats = [] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-slate-200 bg-linear-to-b from-[#1a4f9c] to-blue-900 shadow-sm">
          <CardContent className="space-y-1 p-4 ">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-300">{stat.label}</div>
            <div className="text-2xl font-black tracking-tight text-white">{stat.value}</div>
            {stat.helper ? <div className="text-xs text-slate-200">{stat.helper}</div> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AccountSectionCard({ title, description, action, children, className }) {
  return (
    <Card className={cn("border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-slate-950">{title}</CardTitle>
            {description ? <CardDescription className="mt-1 text-slate-600">{description}</CardDescription> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">{children}</CardContent>
    </Card>
  );
}

export function AccountEmptyState({ title, description, actionLabel, actionHref, onAction, icon: Icon = CircleAlert }) {
  const actionNode = actionHref ? (
    <Button asChild>
      <Link href={actionHref}>{actionLabel ?? "Explorar"}</Link>
    </Button>
  ) : onAction ? (
    <Button onClick={onAction}>{actionLabel ?? "Continuar"}</Button>
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actionNode}
    </div>
  );
}

export function AccountPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div className="text-sm text-slate-500">
        Página {pagination.page} de {pagination.totalPages} · {pagination.total} item(ns)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
          disabled={pagination.page >= pagination.totalPages}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function getToneClass(kind = "default") {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return tones[kind] ?? tones.default;
}
