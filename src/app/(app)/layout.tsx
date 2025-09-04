
"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Briefcase, MessagesSquare, BookOpen, Newspaper, LogOut, Check, ShoppingCart, Menu, Heart, ThumbsUp, ShieldCheck, Home } from 'lucide-react';
import React from 'react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import MessagingDropdown from '@/components/MessagingDropdown';

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

const publicPaths = ['/mercado-profesionales', '/foro', '/biblioteca', '/marketplace', '/publicaciones'];


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userProfile, isLoading, activeProfile, setActiveProfile, handleLogout } = useAuth();
  const isAdmin = user?.uid === 'ovPIwCma4pcnWk9RnCF4GQEhfJm2';

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/mercado-profesionales", icon: Briefcase, label: "Profesionales" },
    { href: "/marketplace", icon: ShoppingCart, label: "Marketplace" },
    { href: "/biblioteca", icon: BookOpen, label: "Biblioteca" },
    { href: "/publicaciones", icon: Newspaper, label: "Publicaciones" },
  ];

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <FishIcon className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground font-body">Cargando tu espacio...</p>
            </div>
        </div>
    );
  }

  // Authenticated user view
  if (user) {
    return (
     <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <FishIcon className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl">AcuicultoresGT</span>
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-headline transition-colors hover:text-foreground",
                  pathname.startsWith(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="hidden">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <FishIcon className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl">AcuicultoresGT</span>
                </Link>
                {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname.startsWith(item.href) && "text-primary bg-muted"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex w-full items-center justify-end gap-2 md:ml-auto md:gap-4">
            <MessagingDropdown />
            <NotificationsDropdown />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={userProfile?.name || ''} data-ai-hint="person portrait" />
                    <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-0">
                    <Link href={`/perfil/${user.uid}`} className="block rounded-t-md px-2 py-1.5 hover:bg-accent">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none font-headline">{userProfile?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground font-body">
                                {user?.email}
                            </p>
                        </div>
                    </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/aprobaciones">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Aprobaciones</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-headline text-xs font-normal text-muted-foreground px-2">Cambiar Perfil</DropdownMenuLabel>
                    {userProfile?.roles?.map(role => (
                        <DropdownMenuItem key={role} onClick={() => setActiveProfile(role)} className="font-body">
                            {role}
                            {activeProfile === role && <Check className="w-4 h-4 ml-auto" />} 
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="font-body">Configuración</DropdownMenuItem>
                <DropdownMenuItem className="font-body">Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="font-body text-red-600 focus:bg-red-50 focus:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    );
  }

  // Public view for non-authenticated users
  if (!user && publicPaths.includes(pathname)) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PublicNav />
        <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
                {children}
            </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // Fallback, should ideally not be reached if logic is correct
  // The provider will redirect away from protected pages. This is a fallback for the brief moment before redirect.
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <FishIcon className="h-12 w-12 animate-pulse text-primary" />
            <p className="text-muted-foreground font-body">Cargando...</p>
        </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayoutContent>{children}</AppLayoutContent>
  )
}
