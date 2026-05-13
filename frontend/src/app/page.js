import { cookies } from "next/headers";
//import { Card, CardContent } from "@/components/ui/card";
//import { productService } from "@/services/productService";
/*import Link from "next/link";
import Image from "next/image";
import { BannerSection } from "@/components/home/BannerSection";*/
import HomeClient from "@/components/home/HomeClient";

export const metadata = {
  title: "TánaMão - Home",
  description:
    "Bem-vindo à TánaMão! Descubra os melhores produtos com descontos incríveis. Compre agora e aproveite as ofertas exclusivas!",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("userRole")?.value === "admin";
  //const produtos = await productService.getAllProducts();

  return <HomeClient isAdmin={isAdmin} />; /*
    <main className="min-h-screen bg-slate-100">
      <BannerSection isAdmin={isAdmin} />
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 ">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-blue-600">Marketplace</p>
            <h2 className="text-xl font-semibold text-slate-800 md:text-2xl">Destaques da TánaMão!</h2>
          </div>
          <Link href="/products" className="text-blue-600 hover:underline text-sm font-medium">
            Ver tudo
          </Link>
        </div>

        {!Array.isArray(produtos) || produtos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg text-slate-600 font-medium">Nenhum produto encontrado.</h3>
            <p className="text-slate-400 text-sm mt-1">Verifique se o backend está rodando!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {produtos.map((produto) => (
              <Card
                key={produto.id}
                className="group cursor-pointer hover:shadow-xl transition-all border-none overflow-hidden rounded-xl"
              >
                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={produto.mainImageUrl || "https://placehold.co/400x400/1a4f9c/white?text=Sem+Foto"}
                    alt={produto.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    fill
                  />
                  {produto.basePrice > 150 && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">
                      Frete Grátis
                    </div>
                  )}
                </div>
                <CardContent className="p-4 bg-white border-t border-slate-50">
                  <h3 className="text-sm text-slate-600 line-clamp-2 mb-2 h-10 group-hover:text-blue-700 transition-colors">
                    {produto.name}
                  </h3>
                  <div className="flex flex-col">
                    {(() => {
                      const mainVariant = produto.mainVariant ?? null;
                      const currentPrice = mainVariant?.price ?? produto.basePrice;
                      const previousPrice = mainVariant?.previousPrice ?? null;
                      const isPromo = Boolean(mainVariant?.onPromotion && mainVariant?.salePrice != null);
                      const displayPrice = isPromo ? mainVariant.salePrice : currentPrice;
                      const crossedPrice = isPromo ? currentPrice : (previousPrice ?? produto.basePrice * 1.2);

                      return (
                        <>
                          <span className="text-xs text-slate-400 line-through">
                            R$ {Number(crossedPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xl font-bold text-slate-900">
                            R$ {Number(displayPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-blue-500 font-semibold uppercase mt-1">
                            em 10x sem juros
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );*/
}
