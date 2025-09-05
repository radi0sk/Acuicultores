
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
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function FishIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 16.5C18.985 16.5 21 14.485 21 12C21 9.515 18.985 7.5 16.5 7.5H7.5C5.015 7.5 3 9.515 3 12C3 14.485 5.015 16.5 7.5 16.5H16.5Z" />
      <path d="M16.5 7.5C18.985 7.5 21 9.515 21 12" />
      <path d="M7.5 16.5 3 21" />
      <path d="M16.5 16.5 21 21" />
      <circle cx="8" cy="12" r="1" />
    </svg>
  );
}


const navItems = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
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
        <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base px-2"
          >
            <FishIcon className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl">AcuicultoresGT</span>
        </Link>
      
      {pathname === '/dashboard' && userProfile && (
        <Card>
            <CardHeader className="p-4 flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.photoURL || undefined} alt={userProfile.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{userProfile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-headline text-lg">Hola, {getFirstName()}</CardTitle>
                    <CardDescription className="text-xs font-body">Bienvenido/a de nuevo</CardDescription>
                </div>
            </CardHeader>
            <CardFooter className="p-4 pt-0">
                <Button asChild className="w-full" variant="outline" size="sm">
                    <Link href={`/perfil/${user?.uid}`}>Ver mi perfil</Link>
                </Button>
            </CardFooter>
        </Card>
      )}
      
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? 'secondary' : 'ghost'}
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
