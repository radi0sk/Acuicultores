
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ShoppingCart, BookOpen, ArrowUpRight, PenSquare } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function QuickAccess() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Accesos Rápidos</CardTitle>
                <CardDescription className="font-body">Tus módulos más utilizados.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                 <Button asChild>
                    <Link href="/publicaciones/crear">
                        <PenSquare className="mr-2 h-4 w-4"/>
                        Crear Publicación
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/biblioteca/aportar">
                        <BookOpen className="mr-2 h-4 w-4"/>
                        Aportar a la Biblioteca
                    </Link>
                </Button>
                <Link href="/mercado-profesionales" className="flex items-center gap-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-secondary/80">
                    <Briefcase className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                        <p className="font-headline text-sm font-semibold">Profesionales</p>
                        <p className="text-sm text-muted-foreground font-body">Encuentra técnicos y proveedores.</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Link href="/marketplace" className="flex items-center gap-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-secondary/80">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                        <p className="font-headline text-sm font-semibold">Marketplace</p>
                        <p className="text-sm text-muted-foreground font-body">Compra y vende productos.</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </Link>
            </CardContent>
        </Card>
    );
}

    