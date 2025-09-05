
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tag, BarChart3, List, ArrowLeft, PlusCircle, MessagesSquare } from "lucide-react";

function VenderNav() {
    const pathname = usePathname();

    const navLinks = [
        { href: "/marketplace/vender", label: "Tus Publicaciones", icon: List },
        { href: "/marketplace/vender/estadisticas", label: "Estadísticas", icon: BarChart3 },
        { href: "/mensajes", label: "Mensajes", icon: MessagesSquare },
    ];

    return (
        <aside className="hidden md:flex flex-col gap-6 sticky top-6">
            <Button asChild className="w-full font-headline">
                <Link href="/marketplace/vender/crear">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Publicación
                </Link>
            </Button>
            <nav className="flex flex-col gap-1 border-t pt-4">
                {navLinks.map(link => (
                    <Button
                        key={link.href}
                        asChild
                        variant={pathname === link.href ? "secondary" : "ghost"}
                        className="justify-start font-headline"
                    >
                        <Link href={link.href}>
                            <link.icon className="mr-3 h-5 w-5" />
                            {link.label}
                        </Link>
                    </Button>
                ))}
            </nav>
            <div className="border-t pt-4">
                <Button asChild variant="outline" className="w-full font-headline">
                    <Link href="/marketplace">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Ir a Comprar
                    </Link>
                </Button>
            </div>
        </aside>
    );
}


export default function VenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
        <VenderNav />
        <main className="p-6">
            {children}
        </main>
    </>
  );
}
