
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Briefcase, LayoutDashboard, MessageSquare, ShoppingCart, Newspaper } from 'lucide-react';
import Image from 'next/image';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';


const features = [
    {
        icon: <LayoutDashboard className="w-8 h-8 text-primary" />,
        title: "Panel de Control Unificado",
        description: "Dashboards personalizados, notificaciones y métricas clave para tu operación."
    },
    {
        icon: <Briefcase className="w-8 h-8 text-primary" />,
        title: "Mercado de Profesionales",
        description: "Conecta con biólogos, técnicos y consultores. Revisa perfiles, calendarios y contacta directamente."
    },
    {
        icon: <ShoppingCart className="w-8 h-8 text-primary" />,
        title: "Marketplace de Insumos",
        description: "Encuentra alimentos, equipos y todo lo necesario. Compara precios y gestiona tus compras."
    },
    {
        icon: <BookOpen className="w-8 h-8 text-primary" />,
        title: "Biblioteca de Conocimiento",
        description: "Accede a guías, investigaciones y cursos. Aprende a tu ritmo y guarda tu contenido favorito."
    },
    {
        icon: <Newspaper className="w-8 h-8 text-primary" />,
        title: "Centro de Publicaciones",
        description: "Mantente al día con anuncios, noticias y artículos relevantes de la comunidad acuícola."
    },
    {
        icon: <MessageSquare className="w-8 h-8 text-primary" />,
        title: "Foro Comunitario",
        description: "Participa en discusiones, resuelve dudas y colabora con otros miembros de la comunidad."
    }
];

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <PublicNav />

            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-secondary/30">
                    <div className="container px-4 md:px-6">
                        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                             <Image
                                src="https://placehold.co/600x400.png"
                                data-ai-hint="lake aquaculture"
                                alt="Hero"
                                width={600}
                                height={400}
                                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                                priority
                            />
                            <div className="flex flex-col justify-center space-y-4">
                                <div className="space-y-2">
                                    <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                                        La Plataforma Integral para la Acuicultura en Guatemala
                                    </h1>
                                    <p className="font-body max-w-[600px] text-muted-foreground md:text-xl">
                                        Conectamos a productores, técnicos y proveedores para fortalecer la acuicultura sostenible a nivel nacional.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                    <Button size="lg" asChild className="font-headline bg-primary hover:bg-primary/90">
                                        <Link href="/auth">
                                            Únete a la Comunidad
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="space-y-2">
                                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-headline text-primary">Nuestros Módulos</div>
                                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Todo lo que necesitas, en un solo lugar</h2>
                                <p className="font-body max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                    Desde la gestión de tu producción hasta la conexión con expertos y proveedores. AcuicultoresGT te ofrece las herramientas para crecer.
                                </p>
                            </div>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
                           {features.map((feature) => (
                               <Card key={feature.title} className="h-full">
                                   <CardHeader className="flex flex-row items-center gap-4">
                                       {feature.icon}
                                       <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                                   </CardHeader>
                                   <CardContent>
                                       <p className="font-body text-sm text-muted-foreground">{feature.description}</p>
                                   </CardContent>
                               </Card>
                           ))}
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}
