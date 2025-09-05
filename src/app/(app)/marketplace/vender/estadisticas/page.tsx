
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Eye, Heart, Share2, Users, ArrowUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  title: string;
  image: string | null;
  views: number;
  saves: number;
  createdAt: Timestamp;
}

const StatisticsSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div>
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-28 mt-1" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-28 mt-1" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-28 mt-1" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-28 mt-1" /></CardContent></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4"><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
            <Card className="col-span-4 lg:col-span-3"><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-md" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-8 w-20" /></div>)}</CardContent></Card>
        </div>
    </div>
);


export default function StatisticsPage() {
    const { user, userProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        const q = query(
            collection(clientDb, "products"),
            where("sellerId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userProducts: Product[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                userProducts.push({
                    id: doc.id,
                    title: data.title,
                    image: data.image || (data.images && data.images[0]) || null,
                    views: data.viewCount || 0,
                    saves: data.saveCount || 0,
                    createdAt: data.createdAt,
                });
            });
            setProducts(userProducts);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [user]);

    const summaryData = useMemo(() => {
        return products.reduce((acc, product) => {
            acc.totalViews += product.views;
            acc.totalSaves += product.saves;
            return acc;
        }, { totalViews: 0, totalSaves: 0 });
    }, [products]);

    const chartData = useMemo(() => {
        const monthlyData: { [key: string]: { views: number } } = {};
        
        products.forEach(product => {
            if (product.createdAt) {
                const month = format(product.createdAt.toDate(), 'MMM', { locale: es });
                if (!monthlyData[month]) {
                    monthlyData[month] = { views: 0 };
                }
                monthlyData[month].views += product.views;
            }
        });

        // Ensure we have data for the last 6 months, even if it's zero
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push(format(d, 'MMM', { locale: es }));
        }

        return last6Months.map(month => ({
            date: month.charAt(0).toUpperCase() + month.slice(1),
            views: monthlyData[month]?.views || 0
        }));

    }, [products]);

    const topProducts = useMemo(() => {
        return [...products]
            .sort((a, b) => (b.views + b.saves) - (a.views + a.saves))
            .slice(0, 3);
    }, [products]);

    if (loading) {
        return <StatisticsSkeleton />;
    }

  return (
    <main className="flex flex-col gap-6">
        <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">Estadísticas de Vendedor</h2>
            <p className="text-muted-foreground font-body">Un resumen del rendimiento de tus publicaciones en el marketplace.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline">Vistas Totales</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryData.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground font-body flex items-center">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1"/>
                    +20.1% desde el mes pasado
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline">Guardados Totales</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summaryData.totalSaves.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground font-body flex items-center">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1"/>
                    +12.5% desde el mes pasado
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline">Veces Compartido</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{(215).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground font-body flex items-center">
                    <ArrowUp className="h-4 w-4 text-green-500 mr-1"/>
                    +8.2% desde el mes pasado
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-headline">Seguidores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{userProfile?.followersCount || 0}</div>
                <p className="text-xs text-muted-foreground font-body">+2 nuevos esta semana</p>
            </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="font-headline">Rendimiento de Publicaciones (Vistas)</CardTitle>
                <CardDescription className="font-body">Vistas totales de todas tus publicaciones en los últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                        cursor={{fill: 'hsl(var(--muted))'}}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col space-y-1">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Vistas
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                        {payload[0].value?.toLocaleString()}
                                    </span>
                                    </div>
                                </div>
                                </div>
                            )
                            }
                            return null
                        }}
                    />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
            <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle className="font-headline">Publicaciones más populares</CardTitle>
                <CardDescription className="font-body">Tus productos con más vistas y guardados.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {topProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4">
                        {product.image ? (
                           <Image 
                                src={product.image}
                                alt={product.title}
                                width={64}
                                height={64}
                                className="w-16 h-16 object-cover rounded-md border"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 space-y-1">
                            <Link href={`/marketplace/${product.id}`} className="font-headline text-sm font-semibold hover:underline">
                                {product.title}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3"/> {product.views.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><Heart className="h-3 w-3"/> {product.saves.toLocaleString()}</span>
                            </div>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/marketplace/vender/editar/${product.id}`}>
                                Gestionar
                            </Link>
                        </Button>
                    </div>
                ))}
            </CardContent>
            </Card>
        </div>
    </main>
  );
}
