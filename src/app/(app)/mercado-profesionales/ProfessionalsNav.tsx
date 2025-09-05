
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit, UserPlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

export default function ProfessionalsNav() {
  const { user, professionalProfile } = useAuth();
  const hasProfessionalProfile = professionalProfile && Object.keys(professionalProfile).length > 0;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base px-2">
        <FishIcon className="h-8 w-8 text-primary" />
        <span className="font-headline text-2xl">AcuicultoresGT</span>
      </Link>
      
      {user && (
        <div className="px-2">
          <Button asChild className="w-full font-headline">
            <Link href="/mercado-profesionales/registro">
              {hasProfessionalProfile ? <Edit className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {hasProfessionalProfile ? "Editar Perfil Profesional" : "Regístrate como Profesional"}
            </Link>
          </Button>
        </div>
      )}

      <div className="px-2 space-y-4 border-t pt-4">
        <h2 className="font-headline font-semibold">Filtros</h2>
        <div className="space-y-2">
            <Label htmlFor="search" className="font-body">Búsqueda</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Nombre, habilidad..." className="pl-9" />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="specialty" className="font-body">Especialidad</Label>
            <Select>
                <SelectTrigger id="specialty">
                    <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    {/* Add other specialties dynamically here */}
                </SelectContent>
            </Select>
        </div>
      </div>
    </div>
  );
}
