
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, List, Package, Fish, Wrench, Tag, ArrowLeft } from "lucide-react";
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
    title: "Equipo",
    description: "Vende equipo de segunda mano, como bombas, tanques, etc.",
    href: "/marketplace/vender/crear/equipo",
    category: "equipo",
  },
];

export default function CreatePublicationPage() {
  return (
    <main>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-3xl font-bold tracking-tight">Elegir tipo de publicación</h2>
          <Button asChild variant="outline">
            <Link href="/marketplace/vender"><ArrowLeft className="mr-2 h-4 w-4"/> Ir a Tus Publicaciones</Link>
          </Button>
        </div>
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
  );
}
