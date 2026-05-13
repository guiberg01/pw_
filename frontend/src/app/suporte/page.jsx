import Link from "next/link";
import { CloudCog } from "lucide-react";

export const metadata = {
  title: "Suporte - Tána Mão!",
  description: "Precisa de ajuda? Entre em contato com nosso suporte para resolver suas dúvidas e problemas.",
};

export default function suportePage() {
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
      <div className="grid place-items-center gap-0 mx-auto px-4">
        <CloudCog className="w-18 h-18" />
        <h1 className="flex mb-1 gap-2 items-center text-center text-2xl font-bold max-[492px]:text-1xl">
          Estamos desenvolvendo um suporte built-in para melhor atende-los!
        </h1>
        <h3 className=" font-bold max-[492px]:text-2xl text-3xl text-yellow-400">Enquanto isso...</h3>
      </div>
      <p className="text-center px-2">
        Mande sua solicitação em nosso e-mail, ficaremos felizes em te ajudar com o que precisar!
      </p>
      <Link
        href="mailto:guilherme.goncalves01@hotmail.com?subject=Suporte%20Tána%20Mão&body=Olá,%20preciso%20de%20ajuda%20com..."
        className="px-2 py-1 bg-yellow-400 max-[492px]:text-sm text-[#1a4f9c] font-bold rounded-md hover:bg-yellow-300 hover:scale-105 transition"
      >
        guilherme.goncalves01@hotmail.com
      </Link>
    </div>
  );
}
