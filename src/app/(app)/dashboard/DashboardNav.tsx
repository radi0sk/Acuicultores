
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
  MessageSquare,
  User,
  ShieldCheck,
  LogOut,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


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
    { href: "/mensajes", icon: MessageSquare, label: "Mensajes" },
];

export default function DashboardNav() {
  const { user, userProfile, handleLogout } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.uid === 'ovPIwCma4pcnWk9RnCF4GQEhfJm2';

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
      
      {userProfile && (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Card className="hover:bg-accent cursor-pointer transition-colors">
                    <CardHeader className="p-4 flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user?.photoURL || undefined} alt={userProfile.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{userProfile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-headline text-lg md:text-xl">Hola, {getFirstName()}</CardTitle>
                            <CardDescription className="text-sm md:text-base font-body">{userProfile.roles?.[0] || 'Miembro'}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none font-headline">{userProfile.name}</p>
                    <p className="text-xs leading-none text-muted-foreground font-body">
                        {user?.email}
                    </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={`/perfil/${user?.uid}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href={`/mercado-profesionales/registro`}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Editar Perfil Profesional</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                </DropdownMenuItem>
                {isAdmin && (
                <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/admin/aprobaciones">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Aprobaciones</span>
                </Link>
                </DropdownMenuItem>
                </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <nav className="flex flex-col gap-y-1.5">
        {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={cn(
                    "justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-full",
                    "text-lg hover:no-underline",
                    isActive 
                        ? "font-semibold text-foreground bg-neutral-100" 
                        : "font-normal text-neutral-700",
                    "hover:bg-neutral-100"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-6 w-6" />
                  {item.label}
                </Link>
              </Button>
            )
        })}
      </nav>
    </div>
  );
}
