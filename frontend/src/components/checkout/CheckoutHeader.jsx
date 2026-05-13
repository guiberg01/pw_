"use client";

import Link from "next/link";

export function CheckoutHeader() {
  return (
    <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <Link href="/" className="text-center">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">
              <span className="text-[#1a4f9c] mr-1">Tána</span>
              <span className="rounded-sm bg-yellow-400 px-1 text-blue-900">Mão!</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
