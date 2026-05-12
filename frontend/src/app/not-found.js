import Link from "next/link";
import { MapPinX } from "lucide-react";

export const metadata = {
  title: "Página Não Encontrada - Tána Mão!",
};

export default function NotFound() {
  return (
    <div className="bg-[#1a4f9c] isolate text-white relative overflow-hidden min-h-full flex-1 flex flex-col items-center justify-center gap-4">
      <div
        className="absolute -z-1 top-1/2 left-1/2 -translate-x-1/2
                   w-140 h-140 sm:w-200 sm:h-200
                   rounded-full 
                   bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.7)_0%,rgba(250,204,21,0)_70%)] 
                   blur-[100px] sm:blur-[130px] 
                   pointer-events-none"
      />
      <div className="grid place-items-center gap-0">
        <MapPinX className="w-16 h-16" />
        <h1 className="flex gap-2 items-center text-5xl font-bold">
          <span className="p-1 rounded-md text-3xl text-[#1a4f9c] font-bold bg-yellow-400">404</span> Está perdido
          <span className=" font-bold text-6xl text-yellow-400">?</span>
        </h1>
      </div>
      <p className="text-center">
        Ops! O conteúdo que você procura não existe... <br /> Mas não se preocupe! Te ajudamos a voltar aos trilhos.
      </p>
      <Link
        href="/"
        className="px-2 py-1 bg-yellow-400 text-[#1a4f9c] font-bold rounded-md hover:bg-yellow-300 hover:scale-105 transition"
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}
