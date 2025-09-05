
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
    PlusCircle, 
    List, 
    BarChart2, 
    MessageSquare, 
    Home,
    Tag
} from "lucide-react";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/marketplace/vender", label: "Tus publicaciones", icon: List },
    { href: "/marketplace/vender/estadisticas", label: "Estadísticas", icon: BarChart2 },
    { href: "/mensajes", label: "Mensajes", icon: MessageSquare, isExternal: true },
  ];

  const isVenderSection = pathname.startsWith('/marketplace/vender');

  return (
    <>
        <aside className="hidden md:flex flex-col gap-4 sticky top-6">
            {isVenderSection ? (
                 <nav className="flex flex-col gap-1">
                    <h1 className="font-headline text-2xl font-bold px-3 mb-2">Vender</h1>
                    {navLinks.map(link => (
                        <Button
                            key={link.href}
                            asChild
                            variant={pathname === link.href ? "secondary" : "ghost"}
                            className="justify-start font-headline text-base"
                        >
                            <Link href={link.href}>
                                <link.icon className="mr-3 h-5 w-5" />
                                {link.label}
                            </Link>
                        </Button>
                    ))}
                    <div className="px-3 pt-2">
                        <Button asChild className="w-full font-headline bg-primary hover:bg-primary/90">
                            <Link href="/marketplace/vender/crear">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Publicación
                            </Link>
                        </Button>
                    </div>
                </nav>
            ) : (
                <>
                    <div>
                        <h1 className="font-headline text-2xl font-bold">Marketplace</h1>
                        <p className="font-body text-muted-foreground text-sm">Explora productos y equipos.</p>
                    </div>
                    <div>
                        <Button asChild className="w-full font-headline">
                            <Link href="/marketplace/vender">
                                <Tag className="mr-2 h-4 w-4" />
                                Ir a Vender
                            </Link>
                        </Button>
                    </div>
                </>
            )}

            <div className="px-3 border-t pt-4">
                 <Button asChild className="w-full font-headline" variant="outline">
                     <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Inicio
                    </Link>
                </Button>
            </div>
        </aside>
        {children}
    </>
  );
}

    