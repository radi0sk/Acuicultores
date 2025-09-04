
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

import {
  Home,
  Briefcase,
  ShoppingCart,
  BookOpen,
  Newspaper,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
    { href: "/mercado-profesionales", icon: Briefcase, label: "Profesionales" },
    { href: "/marketplace", icon: ShoppingCart, label: "Marketplace" },
    { href: "/biblioteca", icon: BookOpen, label: "Biblioteca" },
    { href: "/publicaciones", icon: Newspaper, label: "Publicaciones" },
];

export default function DashboardNav() {
  const { user, userProfile } = useAuth();
  const pathname = usePathname();

  const getFirstName = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0];
    }
    return "de nuevo";
  }

  return (
    <div className="space-y-6">
      <Card>
          <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-14 w-14">
                  <AvatarImage src={user?.photoURL || undefined} alt={userProfile?.name || ''} data-ai-hint="person portrait" />
                  <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
              </Avatar>
               <div>
                  <CardTitle className="font-headline text-lg">{userProfile?.name}</CardTitle>
                  <CardDescription className="font-body text-xs">@{userProfile?.name?.replace(/\s+/g, '').toLowerCase()}</CardDescription>
              </div>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-muted-foreground font-body line-clamp-3">
                  Bienvenido/a {getFirstName()}. Este es tu espacio para conectar, compartir y crecer con la comunidad.
              </p>
          </CardContent>
           <CardFooter>
              <Button asChild className="w-full" variant="secondary">
                  <Link href={`/perfil/${user?.uid}`}>Ver mi perfil</Link>
              </Button>
          </CardFooter>
      </Card>
      
      <nav className="flex flex-col gap-1">
        <Button
            asChild
            variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
            className="justify-start font-headline text-base"
          >
            <Link href="/dashboard">
              <Home className="mr-3 h-5 w-5" />
              Inicio
            </Link>
          </Button>
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
            className="justify-start font-headline text-base"
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
}
