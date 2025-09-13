"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { diff_match_patch as DiffMatchPatch } from 'diff-match-patch';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, GitMerge, Check, X } from 'lucide-react';

// Define structures
interface PublicationData {
    id: string;
    authorId: string;
    title: string;
    content: any[];
}
interface SuggestionData {
    id: string;
    originalPublicationId: string;
    suggesterId: string;
    suggesterName: string;
    suggesterAvatar: string;
    suggestedTitle: string;
    suggestedContent: any[];
    suggestionComment: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
}

// Diff component
const DiffViewer = ({ oldText, newText }: { oldText: string, newText: string }) => {
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    return (
        <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {diffs.map(([type, text], index) => {
                const style = {
                    '-1': { backgroundColor: 'hsl(var(--destructive)/0.2)', textDecoration: 'line-through' },
                    '1': { backgroundColor: 'hsl(var(--primary)/0.2)' },
                    '0': {},
                }[type];
                return <span key={index} style={style}>{text}</span>;
            })}
        </p>
    );
};


export default function ReviewSuggestionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const suggestionId = params.suggestionId as string;

    const [publication, setPublication] = useState<PublicationData | null>(null);
    const [suggestion, setSuggestion] = useState<SuggestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (suggestionId && user) {
            const fetchSuggestionAndPublication = async () => {
                setLoading(true);
                try {
                    const suggestionRef = doc(clientDb, 'publicationSuggestions', suggestionId);
                    const suggestionSnap = await getDoc(suggestionRef);

                    if (!suggestionSnap.exists()) {
                        toast({ variant: 'destructive', title: 'Error', description: 'Sugerencia no encontrada.' });
                        router.push('/publicaciones');
                        return;
                    }

                    const suggestionData = { id: suggestionSnap.id, ...suggestionSnap.data() } as SuggestionData;
                    setSuggestion(suggestionData);

                    const publicationRef = doc(clientDb, 'publications', suggestionData.originalPublicationId);
                    const publicationSnap = await getDoc(publicationRef);

                    if (!publicationSnap.exists() || publicationSnap.data().authorId !== user.uid) {
                        toast({ variant: 'destructive', title: 'Error', description: 'No tienes permiso para revisar esta sugerencia.' });
                        router.push('/publicaciones');
                        return;
                    }
                    
                    const pubData = { id: publicationSnap.id, ...publicationSnap.data() } as PublicationData;
                    setPublication(pubData);

                } catch (err) {
                    console.error(err);
                    toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos.' });
                } finally {
                    setLoading(false);
                }
            };
            fetchSuggestionAndPublication();
        }
    }, [suggestionId, user, router, toast]);

    const handleDecision = async (decision: 'approve' | 'reject') => {
        if (!publication || !suggestion) return;
        
        setIsProcessing(true);
        try {
            const batch = writeBatch(clientDb);
            const suggestionRef = doc(clientDb, 'publicationSuggestions', suggestionId);
            
            if (decision === 'approve') {
                const publicationRef = doc(clientDb, 'publications', publication.id);
                batch.update(publicationRef, {
                    title: suggestion.suggestedTitle,
                    content: suggestion.suggestedContent
                });
                batch.update(suggestionRef, { status: 'approved' });
                await batch.commit();
                toast({ title: 'Sugerencia Aprobada', description: 'La publicación ha sido actualizada con los cambios.' });
            } else {
                batch.update(suggestionRef, { status: 'rejected' });
                await batch.commit();
                toast({ title: 'Sugerencia Rechazada', description: 'La sugerencia ha sido marcada como rechazada.' });
            }
            router.push(`/publicaciones/${publication.id}`);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la decisión.' });
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
             <div className="max-w-6xl mx-auto p-4 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    if (!publication || !suggestion) {
        return <p>No se pudieron cargar los datos.</p>;
    }

    const originalText = publication.content.filter(b => b.type === 'text').map(b => b.value).join('\n\n');
    const suggestedText = suggestion.suggestedContent.filter(b => b.type === 'text').map(b => b.value).join('\n\n');

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
            <div>
                 <Button asChild variant="outline" className="mb-4">
                    <Link href={`/publicaciones/${publication.id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Publicación</Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Revisar Propuesta de Cambios</h1>
                <p className="text-muted-foreground font-body">Revisa y decide si quieres incorporar esta sugerencia a tu publicación.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                         <Avatar>
                            <AvatarImage src={suggestion.suggesterAvatar} alt={suggestion.suggesterName} />
                            <AvatarFallback>{suggestion.suggesterName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-headline">Propuesta de {suggestion.suggesterName}</CardTitle>
                            <CardDescription>{format(suggestion.createdAt.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es })}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="font-body text-muted-foreground italic bg-muted p-3 rounded-md">"{suggestion.suggestionComment}"</p>
                </CardContent>
                 <CardFooter className="flex justify-end gap-2">
                    <Button variant="destructive" onClick={() => handleDecision('reject')} disabled={isProcessing || suggestion.status !== 'pending'}>
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                    </Button>
                    <Button onClick={() => handleDecision('approve')} disabled={isProcessing || suggestion.status !== 'pending'}>
                        <Check className="mr-2 h-4 w-4" />
                        Aceptar y Fusionar
                    </Button>
                </CardFooter>
            </Card>

            {suggestion.status !== 'pending' && (
                <Alert variant={suggestion.status === 'approved' ? 'default' : 'destructive'} className="bg-secondary">
                    <GitMerge className="h-4 w-4" />
                    <AlertTitle className="font-headline">Esta sugerencia ya fue {suggestion.status === 'approved' ? 'aprobada' : 'rechazada'}.</AlertTitle>
                    <AlertDescription className="font-body">No se pueden realizar más acciones.</AlertDescription>
                </Alert>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                    <h2 className="font-headline text-xl font-bold mb-4">Versión Original</h2>
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-bold text-lg">{publication.title}</h3>
                        {publication.content.map((block: any, index: number) => (
                            <div key={index}>
                                {block.type === 'text' && <p className="text-muted-foreground whitespace-pre-wrap">{block.value}</p>}
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <h2 className="font-headline text-xl font-bold mb-4">Versión Sugerida</h2>
                     <div className="border rounded-lg p-4 space-y-4 border-primary/50 bg-primary/5">
                        <h3 className="font-bold text-lg">
                           <DiffViewer oldText={publication.title} newText={suggestion.suggestedTitle} />
                        </h3>
                        <div>
                             <h4 className="font-semibold mb-2">Cambios en el texto:</h4>
                             <DiffViewer oldText={originalText} newText={suggestedText} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
