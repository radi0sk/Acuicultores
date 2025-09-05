
"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MessageCircle, Search, UserPlus, Edit, Award, Mail } from "lucide-react"
import Link from 'next/link'
import { useState, useMemo, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { collectionGroup, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { Skeleton } from "@/components/ui/skeleton"

interface ProfessionalProfile {
    id: string; // User ID
    name: string;
    photoURL: string;
    professionalPhotoURL?: string;
    professionalType: string;
    specialization: string;
    location: string;
    experiences: { role: string; company: string; }[];
    isColegiado?: boolean;
}

const ProfessionalCardSkeleton = () => (
    <Card>
        <CardHeader className="p-6 pb-0">
            <div className="flex flex-row items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
             <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
            <div className="flex gap-2 w-full">
                <Skeleton className="h-10 w-full" />
            </div>
        </CardFooter>
    </Card>
)


export default function ProfessionalsPage() {
  const { user, professionalProfile: currentUserProfessionalProfile } = useAuth();
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const professionalProfilesQuery = query(
        collectionGroup(clientDb, 'professionalProfile'),
        where('isProfessional', '==', true)
    );

    const unsubscribe = onSnapshot(professionalProfilesQuery, async (snapshot) => {
        const fetchedProfessionals: ProfessionalProfile[] = [];
        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const userDocRef = docSnapshot.ref.parent.parent;
            if (userDocRef) {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    fetchedProfessionals.push({
                        id: userDoc.id,
                        name: userData.name,
                        photoURL: userData.photoURL,
                        professionalPhotoURL: data.professionalPhotoURL,
                        professionalType: data.professionalType,
                        specialization: data.specialization,
                        location: data.location,
                        experiences: data.experiences || [],
                        isColegiado: data.isColegiado || false,
                    });
                }
            }
        }
        setProfessionals(fetchedProfessionals);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasProfessionalProfile = currentUserProfessionalProfile && Object.keys(currentUserProfessionalProfile).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Mercado de Profesionales</h1>
          <p className="text-muted-foreground font-body">Encuentra el experto que necesitas para llevar tu producción al siguiente nivel.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
            Array.from({ length: 6 }).map((_, index) => <ProfessionalCardSkeleton key={index} />)
        ) : professionals.length > 0 ? (
            professionals.map((prof) => (
            <Card key={prof.id} className="flex flex-col hover:border-primary transition-colors">
                <CardHeader className="p-6 pb-0">
                  <Link href={`/perfil/${prof.id}`} className="flex flex-row items-start gap-4 group">
                      <Avatar className="h-16 w-16 border">
                          <AvatarImage src={prof.professionalPhotoURL || prof.photoURL} alt={prof.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{prof.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                          <CardTitle className="font-headline text-xl group-hover:underline flex items-center gap-2">
                              {prof.name}
                              {prof.isColegiado && <Award className="h-5 w-5 text-yellow-500" title="Profesional Colegiado"/>}
                          </CardTitle>
                          <CardDescription className="font-body">{prof.specialization}</CardDescription>
                          <p className="text-sm text-muted-foreground font-body mt-1">{prof.professionalType}</p>
                          <p className="text-xs text-muted-foreground font-body mt-1">{prof.location}</p>
                      </div>
                  </Link>
                </CardHeader>
                <CardContent className="flex-grow p-6 pt-4">
                    <div className="flex flex-wrap gap-2">
                        {prof.experiences?.slice(0, 3).map((exp, i) => (
                            <Badge key={i} variant="secondary" className="font-body">{exp.role}</Badge>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                    <Button className="w-full font-headline bg-primary hover:bg-primary/90" asChild>
                        <Link href={`/perfil/${prof.id}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Ver Perfil y Solicitar
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            ))
         ) : (
            <div className="w-full text-center py-16 col-span-full">
                <h2 className="font-headline text-2xl font-semibold">No se encontraron profesionales</h2>
                <p className="text-muted-foreground font-body mt-2">Intenta ajustar tu búsqueda o cambia los filtros.</p>
            </div>
         )}
      </div>
    </div>
  )
}
