"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp, collection, query, where, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BrainCircuit, Book, Edit, GitMerge, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import CommentSection from './CommentSection';

interface StoredContentBlock {
    type: 'text' | 'image' | 'video';
    value: string;
}

interface PublicationData {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    createdAt: Timestamp;
    title: string;
    content: StoredContentBlock[] | string; // Allow old string format for migration
    tags: string[];
    references?: string;
    isOpenInvestigation?: boolean;
    likes: number;
    likedBy?: string[];
}

interface Suggestion {
    id: string;
    suggesterName: string;
    suggesterAvatar: string;
    createdAt: Timestamp;
}

export default function PublicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [publication, setPublication] = useState<PublicationData | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const publicationId = params.publicationId as string;

    useEffect(() => {
        if (!publicationId) return;

        const docRef = doc(clientDb, 'publications', publicationId);

        const unsubscribePublication = onSnapshot(docRef, (docSnap) => {
             if (docSnap.exists()) {
                const data = docSnap.data() as Omit<PublicationData, 'id'>;
                const pubData = { id: docSnap.id, ...data };
                setPublication(pubData);
                setLikes(pubData.likes || 0);
                setHasLiked(user ? pubData.likedBy?.includes(user.uid) || false : false);

                // Conditional logic: If the current user is the author, fetch pending suggestions.
                if (user && user.uid === data.authorId) {
                    const suggestionsQuery = query(
                        collection(clientDb, 'publicationSuggestions'),
                        where('originalPublicationId', '==', publicationId),
                        where('status', '==', 'pending')
                    );
                    
                    // This onSnapshot is nested intentionally to only run for the author.
                    onSnapshot(suggestionsQuery, (snapshot) => {
                        const pendingSuggestions: Suggestion[] = [];
                        snapshot.forEach((doc) => {
                            pendingSuggestions.push({ id: doc.id, ...doc.data() } as Suggestion);
                        });
                        setSuggestions(pendingSuggestions);
                    });
                }
            } else {
                console.log('No such document!');
                router.push('/publicaciones');
            }
            setLoading(false);
        });

        return () => unsubscribePublication();
    }, [publicationId, router, user]);

    const handleLike = async () => {
        if (!user || !publication || isLiking) return;

        setIsLiking(true);
        const publicationRef = doc(clientDb, "publications", publication.id);
        
        try {
            if (hasLiked) {
                await updateDoc(publicationRef, {
                    likes: increment(-1),
                    likedBy: arrayRemove(user.uid)
                });
            } else {
                 await updateDoc(publicationRef, {
                    likes: increment(1),
                    likedBy: arrayUnion(user.uid)
                });
            }
        } catch (error) {
            console.error("Error updating likes:", error);
        } finally {
            setIsLiking(false);
        }
    };
    
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-8">
                <Skeleton className="h-10 w-32 mb-6" />
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        )
    }

    if (!publication) {
        return null; // or a not found component
    }

    const formattedDate = publication.createdAt ? format(publication.createdAt.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es }) : '';
    
    // Normalize content to always be an array of blocks for consistent rendering
    const contentBlocks = typeof publication.content === 'string' 
        ? [{ type: 'text', value: publication.content }] 
        : publication.content || [];

    const publicationAuthor = { id: publication.authorId, name: publication.authorName };

    return (
        <article className="max-w-4xl mx-auto flex flex-col gap-8 py-8">
            <div>
                <Button asChild variant="ghost" className="mb-4 -ml-4">
                    <Link href="/publicaciones"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Publicaciones</Link>
                </Button>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {publication.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="font-body">{tag}</Badge>
                    ))}
                    {publication.isOpenInvestigation && (
                        <Badge variant="outline" className="flex items-center gap-1 border-yellow-400 bg-yellow-50 text-yellow-800">
                            <BrainCircuit className="h-3 w-3"/>
                            Investigación Abierta
                        </Badge>
                    )}
                </div>
            </div>
           
            <header className="space-y-2">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">{publication.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground font-body">
                    <Link href={`/perfil/${publication.authorId}`} className="flex items-center gap-2 group">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={publication.authorAvatar} alt={publication.authorName} data-ai-hint="person portrait" />
                            <AvatarFallback>{publication.authorName?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="group-hover:underline">Por {publication.authorName}</span>
                    </Link>
                    <span>•</span>
                    <time dateTime={publication.createdAt?.toDate().toISOString()}>{formattedDate}</time>
                </div>
            </header>

            {user?.uid === publication.authorId && suggestions.length > 0 && (
                 <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                         <div className="flex items-start gap-3">
                            <GitMerge className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <CardTitle className="font-headline text-lg">Tienes {suggestions.length} propuesta{suggestions.length > 1 ? 's' : ''} de cambio</CardTitle>
                                <CardContent className="p-0 pt-1 text-sm text-muted-foreground font-body">Revisa las sugerencias de la comunidad para mejorar tu publicación.</CardContent>
                            </div>
                        </div>
                        <Button asChild>
                            <Link href={`/publicaciones/revision/${suggestions[0].id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Revisar Sugerencias
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>
            )}

            {publication.isOpenInvestigation && user && user.uid !== publication.authorId && (
                <div className="bg-secondary/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                         <BrainCircuit className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-headline font-semibold">Esta es una investigación abierta</h3>
                            <p className="text-sm text-muted-foreground font-body">¿Tienes un aporte? Puedes proponer cambios para mejorar esta publicación.</p>
                        </div>
                    </div>
                     <Button asChild>
                        <Link href={`/publicaciones/proponer/${publication.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Proponer Cambios
                        </Link>
                    </Button>
                </div>
            )}
            
            <Separator />
            
            <div className="prose max-w-none font-body text-foreground text-lg leading-relaxed space-y-6">
                {contentBlocks.map((block, index) => {
                    switch (block.type) {
                        case 'text':
                            return <p key={index} className="whitespace-pre-wrap">{block.value}</p>;
                        case 'image':
                            return (
                                <figure key={index} className="w-full my-6">
                                    <Image 
                                        src={block.value} 
                                        alt={`Imagen de la publicación ${index + 1}`} 
                                        width={1280} height={720} 
                                        className="rounded-lg object-contain w-full h-auto"
                                        data-ai-hint="publication media"
                                    />
                                </figure>
                            );
                        case 'video':
                             return (
                                <figure key={index} className="w-full my-6">
                                    <video src={block.value} className="w-full h-auto rounded-lg" controls>
                                        Tu navegador no soporta la etiqueta de video.
                                    </video>
                                </figure>
                            );
                        default:
                            return null;
                    }
                })}
            </div>

            {publication.references && (
                 <>
                    <Separator />
                    <section className="space-y-4">
                        <h2 className="font-headline text-2xl font-bold flex items-center gap-2"><Book className="h-6 w-6"/>Referencias</h2>
                        <div className="prose max-w-none font-body text-muted-foreground whitespace-pre-wrap text-sm">
                            {publication.references}
                        </div>
                    </section>
                </>
            )}

            <Separator />

             <div className="flex items-center justify-end">
                <Button variant="outline" onClick={handleLike} disabled={!user || isLiking}>
                    <Heart className={cn("mr-2 h-4 w-4", hasLiked && "fill-red-500 text-red-500")} />
                    <span className="font-semibold">{likes}</span>
                </Button>
            </div>

            <CommentSection publicationId={publicationId} publicationAuthor={publicationAuthor} />
            
        </article>
    );
}
