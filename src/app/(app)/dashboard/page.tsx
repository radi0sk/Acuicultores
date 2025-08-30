
"use client"

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Briefcase, Droplets, Fish, MessagesSquare, BookOpen, ShoppingCart } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; 

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [chartData, setChartData] = useState<Array<{month: string, total: number}>>([]);
  
  useEffect(() => {
    // Simulating dynamic data for platform activity (e.g., new posts, products)
    const data = [
      { month: "Ene", total: Math.floor(Math.random() * 50) + 10 },
      { month: "Feb", total: Math.floor(Math.random() * 50) + 15 },
      { month: "Mar", total: Math.floor(Math.random() * 50) + 20 },
      { month: "Abr", total: Math.floor(Math.random() * 50) + 25 },
      { month: "May", total: Math.floor(Math.random() * 50) + 30 },
      { month: "Jun", total: Math.floor(Math.random() * 50) + 35 },
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
        <h1 className="font-headline text-3xl font-bold tracking-tight">Inicio</h1>
        <p className="text-muted-foreground font-body">Bienvenido/a {getFirstName()}. Aquí tienes un resumen de la actividad en la plataforma.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Nuevos Productos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground font-body">en la última semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Consultas en el Foro</CardTitle>
            <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+25</div>
            <p className="text-xs text-muted-foreground font-body">+5 nuevas hoy</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-headline">Profesionales Activos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground font-body">+2 nuevos esta semana</p>
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
            <CardTitle className="font-headline">Actividad de la Plataforma</CardTitle>
             <CardDescription className="font-body">Nuevas publicaciones y productos en los últimos 6 meses.</CardDescription>
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
                  tickFormatter={(value) => `${value}`}
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
