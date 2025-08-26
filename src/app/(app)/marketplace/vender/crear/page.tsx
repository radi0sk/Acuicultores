
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, List, Package, Fish, Wrench, Tag } from "lucide-react";
import Link from "next/link";

const publicationTypes = [
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: "Insumo en Venta",
    description: "Crea una publicación para vender uno o más insumos acuícolas.",
    href: "/marketplace/vender/crear/insumo",
    category: "insumo",
  },
  {
    icon: <Fish className="h-8 w-8 text-primary" />,
    title: "Alevines o Lotes",
    description: "Publica lotes de alevines o peces juveniles para la venta.",
    href: "/marketplace/vender/crear/alevines",
    category: "alevines",
  },
  {
    icon: <Wrench className="h-8 w-8 text-primary" />,
    title: "Equipo Usado",
    description: "Vende equipo de segunda mano, como bombas, tanques, etc.",
    href: "/marketplace/vender/crear/equipo",
    category: "equipo",
  },
];

export default function CreatePublicationPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
      {/* Left Sidebar */}
      <aside className="hidden md:flex flex-col gap-4 sticky top-20">
        <h1 className="font-headline text-2xl font-bold">Crear publicación</h1>
        <nav className="flex flex-col gap-1">
            <Button variant="secondary" className="justify-start font-headline text-base px-3">
                <Tag className="mr-3 h-5 w-5" />
                Elegir tipo
            </Button>
            <Button asChild variant="ghost" className="justify-between w-full font-headline text-base px-3">
                <Link href="/marketplace/vender">
                    <div className="flex items-center">
                        <List className="mr-3 h-5 w-5" />
                        <span>Tus publicaciones</span>
                    </div>
                    <span className="text-xs font-body bg-muted text-muted-foreground rounded-full px-2 py-0.5">6</span>
                </Link>
            </Button>
             <Button variant="ghost" className="justify-start font-headline text-base px-3">
                <HelpCircle className="mr-3 h-5 w-5" />
                Ayuda para vendedores
            </Button>
        </nav>
      </aside>

      {/* Right Content */}
      <main>
        <div className="flex flex-col gap-4">
          <h2 className="font-headline text-3xl font-bold tracking-tight">Elegir tipo de publicación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {publicationTypes.map((type) => (
              <Link key={type.title} href={type.href} className="block h-full group">
                <Card className="h-full group-hover:border-primary transition-colors flex flex-col p-6">
                    <CardHeader className="p-0 mb-4">
                        <div className="p-3 rounded-full bg-secondary w-fit">
                            {type.icon}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                      <CardTitle className="font-headline text-xl">{type.title}</CardTitle>
                      <CardDescription className="font-body mt-2 text-sm text-muted-foreground">
                          {type.description}
                      </CardDescription>
                    </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
