
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu, Briefcase, ShoppingCart, BookOpen, MessagesSquare } from 'lucide-react';

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

const navLinks = [
    { href: "/mercado-profesionales", label: "Profesionales", icon: Briefcase },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
];

export default function PublicNav() {
    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <FishIcon className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl">AcuicultoresGT</span>
            </Link>
            <nav className="ml-auto hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                {navLinks.map(({ href, label }) => (
                    <Link key={href} href={href} className="font-headline text-muted-foreground transition-colors hover:text-foreground">
                        {label}
                    </Link>
                ))}
            </nav>
            <div className="ml-4 hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link href="/auth" className="font-headline">Ingresar</Link>
                </Button>
                <Button asChild className="font-headline bg-primary hover:bg-primary/90">
                    <Link href="/auth">Registrarse</Link>
                </Button>
            </div>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden ml-auto">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader className="hidden">
                        <SheetTitle>Navigation Menu</SheetTitle>
                    </SheetHeader>
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                            <FishIcon className="h-6 w-6 text-primary" />
                            <span className="font-headline text-xl">AcuicultoresGT</span>
                        </Link>
                        {navLinks.map(({ href, label, icon: Icon }) => (
                           <SheetClose asChild key={href}>
                             <Link href={href} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                                <Icon className="h-5 w-5" />
                                {label}
                            </Link>
                           </SheetClose>
                        ))}
                    </nav>
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                         <SheetClose asChild>
                            <Button variant="ghost" asChild>
                                <Link href="/auth" className="font-headline w-full">Ingresar</Link>
                            </Button>
                        </SheetClose>
                         <SheetClose asChild>
                            <Button asChild className="font-headline bg-primary hover:bg-primary/90 w-full">
                                <Link href="/auth">Registrarse</Link>
                            </Button>
                        </SheetClose>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
}
