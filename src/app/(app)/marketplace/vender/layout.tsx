
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
    PlusCircle, 
    List, 
    BarChart2, 
    MessageSquare, 
    Home
} from "lucide-react";

export default function VenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/marketplace/vender", label: "Tus publicaciones", icon: List },
    { href: "/marketplace/vender/estadisticas", label: "Estadísticas", icon: BarChart2 },
    { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col gap-4 sticky top-20">
            <h1 className="font-headline text-2xl font-bold px-3">Vender en Marketplace</h1>
            <nav className="flex flex-col gap-1 px-3">
                {navLinks.map(link => (
                    <Button
                        key={link.href}
                        asChild
                        variant={pathname.startsWith(link.href) && (link.href !== '/mensajes' || pathname === '/mensajes') ? "secondary" : "ghost"}
                        className="justify-start font-headline text-base"
                    >
                        <Link href={link.href}>
                            <link.icon className="mr-3 h-5 w-5" />
                            {link.label}
                        </Link>
                    </Button>
                ))}
            </nav>
            <div className="px-3">
                <Button asChild className="w-full font-headline bg-primary hover:bg-primary/90">
                    <Link href="/marketplace/vender/crear">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Publicación
                    </Link>
                </Button>
            </div>
             <div className="px-3 border-t pt-4">
                 <Button asChild className="w-full font-headline" variant="outline">
                     <Link href="/marketplace">
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Marketplace
                    </Link>
                </Button>
            </div>
        </aside>

        {/* Right Content */}
        <main>
            {children}
        </main>
    </div>
  );
}
