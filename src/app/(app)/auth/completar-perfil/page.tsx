
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { departments, municipalities } from '@/lib/guatemala-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FishIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


function FishIconLoader(props: React.SVGProps<SVGSVGElement>) {
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

export default function CompleteProfilePage() {
    const { user, userProfile, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [department, setDepartment] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && userProfile) {
            if (userProfile.profileComplete) {
                router.push('/dashboard');
            } else {
                setName(userProfile.name || '');
                if (userProfile.roles && userProfile.roles.length > 0) {
                    setRole(userProfile.roles[0]);
                }
            }
        }
    }, [userProfile, isAuthLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim() || !role || !department || !municipality) {
            toast({ variant: 'destructive', title: 'Campos requeridos', description: 'Por favor, completa todos los campos.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const userDocRef = doc(clientDb, 'users', user.uid);
            await updateDoc(userDocRef, {
                name,
                roles: [role],
                location: `${municipality}, ${department}`,
                profileComplete: true,
            });

            toast({ title: '¡Perfil completado!', description: 'Bienvenido/a a la plataforma.' });
            router.push('/dashboard');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu perfil. Inténtalo de nuevo.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthLoading || !userProfile) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <FishIconLoader className="h-12 w-12 animate-pulse text-primary" />
                    <p className="text-muted-foreground font-body">Cargando tu perfil...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">¡Bienvenido/a a AcuicultoresGT!</CardTitle>
                    <CardDescription className="font-body">
                        Solo un paso más. Ayúdanos a completar tu perfil para personalizar tu experiencia.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-headline">Nombre Completo</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role" className="font-headline">¿Cuál es tu rol principal en la acuicultura? *</Label>
                            <Select value={role} onValueChange={setRole} required>
                                <SelectTrigger id="role"><SelectValue placeholder="Selecciona tu rol principal..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Productor">Productor / Granjero</SelectItem>
                                    <SelectItem value="Técnico">Técnico / Consultor</SelectItem>
                                    <SelectItem value="Proveedor">Proveedor de Insumos/Equipos</SelectItem>
                                    <SelectItem value="Investigador">Investigador / Académico</SelectItem>
                                    <SelectItem value="Estudiante">Estudiante</SelectItem>
                                    <SelectItem value="Entusiasta">Entusiasta / Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label className="font-headline">¿Dónde te encuentras? *</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={department} onValueChange={val => { setDepartment(val); setMunicipality(''); }}>
                                    <SelectTrigger><SelectValue placeholder="Departamento"/></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={municipality} onValueChange={setMunicipality} disabled={!department}>
                                    <SelectTrigger><SelectValue placeholder="Municipio"/></SelectTrigger>
                                    <SelectContent>
                                        {(municipalities[department] || []).map(mun => <SelectItem key={mun} value={mun}>{mun}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" className="w-full font-headline" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Finalizar y Entrar a la Plataforma"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
