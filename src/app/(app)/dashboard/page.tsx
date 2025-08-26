
"use client"

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Briefcase, Droplets, Fish, MessagesSquare, BookOpen } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; 

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [chartData, setChartData] = useState<Array<{month: string, total: number}>>([]);
  
  useEffect(() => {
    const data = [
      { month: "Ene", total: Math.floor(Math.random() * 2000) + 1000 },
      { month: "Feb", total: Math.floor(Math.random() * 2000) + 1000 },
      { month: "Mar", total: Math.floor(Math.random() * 2000) + 1000 },
      { month: "Abr", total: Math.floor(Math.random() * 2000) + 1000 },
      { month: "May", total: Math.floor(Math.random() * 2000) + 1000 },
      { month: "Jun", total: Math.floor(Math.random() * 2000) + 1000 },
    ];
    setChartData(data);
  }, []);

  const getFirstName = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0];
    }
    return "de nuevo";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground font-body">Bienvenido/a {getFirstName()}. Aquí tienes un resumen de tu actividad.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Producción Total (kg)</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254 kg</div>
            <p className="text-xs text-muted-foreground font-body">+15.2% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Calidad del Agua</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Óptima</div>
            <p className="text-xs text-muted-foreground font-body">Última medición: hace 2h</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Consultas Abiertas</CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground font-body">1 nueva desde ayer</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Nuevos Artículos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+5</div>
            <p className="text-xs text-muted-foreground font-body">En la última semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Producción Mensual</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="month"
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
                  tickFormatter={(value) => `${value}kg`}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Accesos Rápidos</CardTitle>
            <CardDescription className="font-body">Tus módulos más utilizados.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Link href="/mercado-profesionales" className="flex items-center gap-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-secondary/80">
                <Briefcase className="h-6 w-6 text-primary" />
                <div className="flex-1">
                    <p className="font-headline text-sm font-semibold">Mercado de Profesionales</p>
                    <p className="text-sm text-muted-foreground font-body">Encuentra técnicos y proveedores.</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
             </Link>
             <Link href="/foro" className="flex items-center gap-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-secondary/80">
                <MessagesSquare className="h-6 w-6 text-primary" />
                <div className="flex-1">
                    <p className="font-headline text-sm font-semibold">Foro Comunitario</p>
                    <p className="text-sm text-muted-foreground font-body">Consulta y comparte con la comunidad.</p>
                </div>
                 <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
             </Link>
             <Link href="/biblioteca" className="flex items-center gap-4 rounded-lg bg-secondary p-4 transition-colors hover:bg-secondary/80">
                <BookOpen className="h-6 w-6 text-primary" />
                <div className="flex-1">
                    <p className="font-headline text-sm font-semibold">Biblioteca de Conocimiento</p>
                    <p className="text-sm text-muted-foreground font-body">Aprende nuevas técnicas y guías.</p>
                </div>
                 <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
