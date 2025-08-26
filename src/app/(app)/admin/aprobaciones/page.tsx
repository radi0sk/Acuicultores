
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, FolderClock, ExternalLink, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Contribution {
  id: string;
  title: string;
  summary: string;
  category: string;
  fileUrl: string;
  fileType: string;
  contributorName: string;
  contributorAvatar: string;
  createdAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
}

const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Fecha desconocida';
    return format(timestamp.toDate(), "d 'de' MMMM, yyyy", { locale: es });
}

export default function AprobacionesPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [pending, setPending] = useState<Contribution[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const ADMIN_UID = 'ovPIwCma4pcnWk9RnCF4GQEhfJm2';

    useEffect(() => {
        if (!isLoading && user?.uid !== ADMIN_UID) {
            toast({ variant: 'destructive', title: 'Acceso Denegado', description: 'No tienes permiso para ver esta página.' });
            router.push('/dashboard');
        }
    }, [user, isLoading, router, toast]);

    useEffect(() => {
        if (user?.uid !== ADMIN_UID) return;

        setLoadingData(true);
        const q = query(
            collection(clientDb, 'libraryContributions'), 
            where('status', '==', 'pending'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pendingDocs: Contribution[] = [];
            snapshot.forEach(doc => {
                pendingDocs.push({ id: doc.id, ...doc.data() } as Contribution);
            });
            setPending(pendingDocs);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching pending contributions: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los documentos pendientes.' });
            setLoadingData(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
        const docRef = doc(clientDb, 'libraryContributions', id);
        try {
            await updateDoc(docRef, { status: decision });
            toast({
                title: 'Acción completada',
                description: `El documento ha sido ${decision === 'approved' ? 'aprobado' : 'rechazado'}.`
            });
        } catch (error) {
            console.error("Error updating document status: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del documento.' });
        }
    };

    if (isLoading || loadingData) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0">
                                <Skeleton className="w-full h-full"/>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )
    }

    if (!user || user.uid !== ADMIN_UID) {
        return null; // or a more explicit "access denied" component
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Aprobaciones de Contenido</h1>
                <p className="text-muted-foreground font-body">Revisa y gestiona los documentos aportados por la comunidad.</p>
            </div>
            
            {pending.length === 0 ? (
                <Card className="text-center py-12">
                    <CardHeader>
                        <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
                            <FolderClock className="h-12 w-12 text-muted-foreground"/>
                        </div>
                        <CardTitle className="font-headline mt-4">Bandeja de entrada vacía</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground font-body">No hay documentos pendientes de revisión en este momento.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {pending.map(doc => (
                        <Card key={doc.id} className="p-4">
                             <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-32 h-32 bg-muted rounded-md flex items-center justify-center flex-shrink-0 p-2">
                                    <FileText className="w-16 h-16 text-muted-foreground"/>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Badge variant="secondary" className="capitalize">{doc.category}</Badge>
                                            <h3 className="font-headline font-semibold text-lg mt-1">{doc.title}</h3>
                                        </div>
                                         <Link href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                <ExternalLink className="mr-2 h-4 w-4"/> Ver Documento
                                            </Button>
                                        </Link>
                                    </div>
                                    <p className="font-body text-sm text-muted-foreground line-clamp-2">{doc.summary}</p>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                                         <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={doc.contributorAvatar} alt={doc.contributorName} data-ai-hint="person company" />
                                                <AvatarFallback>{doc.contributorName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>Por {doc.contributorName}</span>
                                        </div>
                                        <span>{formatDate(doc.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                 <Button size="sm" variant="destructive" onClick={() => handleDecision(doc.id, 'rejected')}>
                                    <X className="mr-2 h-4 w-4"/> Rechazar
                                </Button>
                                <Button size="sm" onClick={() => handleDecision(doc.id, 'approved')}>
                                    <Check className="mr-2 h-4 w-4"/> Aprobar
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
