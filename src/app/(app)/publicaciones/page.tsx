
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp, where } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, PenSquare, BrainCircuit, Edit } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

// The data that is stored in Firestore
interface StoredContentBlock {
    type: 'text' | 'image' | 'video';
    value: string;
}

interface Publication {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    createdAt: Timestamp;
    title: string;
    content: StoredContentBlock[] | string; // Allow both for migration
    tags: string[];
    likes: number;
    commentsCount: number;
    isOpenInvestigation?: boolean;
    status: 'published' | 'draft';
}

const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Fecha desconocida';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: es });
}

const getSummary = (content: StoredContentBlock[] | string): string => {
    if (typeof content === 'string') {
        return content; // For old data format
    }
    if (Array.isArray(content)) {
        const firstTextBlock = content.find(block => block.type === 'text');
        return firstTextBlock?.value || 'Esta publicación no tiene contenido de texto.';
    }
    return '';
}

const PublicationList = ({ publications, loading }: { publications: Publication[], loading: boolean}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-10 w-full" /></CardHeader>
                        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                        <CardFooter><Skeleton className="h-8 w-1/2" /></CardFooter>
                    </Card>
                ))}
            </div>
        );
    }
    
    if (publications.length === 0) {
        return (
            <div className="text-center py-16 col-span-full">
                <h3 className="font-headline text-xl">No hay publicaciones aquí</h3>
                <p className="text-muted-foreground font-body mt-2">Parece que aún no hay nada en esta sección.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {publications.map((post) => (
                <Card key={post.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Link href={`/perfil/${post.authorId}`} className="flex items-center gap-3 group">
                                <Avatar>
                                    <AvatarImage src={post.authorAvatar} alt={post.authorName} data-ai-hint="person portrait" />
                                    <AvatarFallback>{post.authorName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-headline font-semibold group-hover:underline">{post.authorName}</p>
                                    <p className="text-xs text-muted-foreground font-body">{formatDate(post.createdAt)}</p>
                                </div>
                            </Link>
                            {post.isOpenInvestigation && (
                                <Badge variant="outline" className="ml-auto flex items-center gap-1">
                                    <BrainCircuit className="h-3 w-3"/>
                                    Investigación Abierta
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="font-headline text-lg pt-4">
                            <Link href={`/publicaciones/${post.id}`} className="hover:text-primary transition-colors">
                                {post.title || <span className="text-muted-foreground italic">Sin Título</span>}
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="font-body text-sm line-clamp-3">{getSummary(post.content)}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {post.tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="font-body">{tag}</Badge>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-4 text-muted-foreground border-t pt-4">
                        {post.status === 'published' ? (
                            <>
                                <div className="flex items-center gap-1.5 text-sm font-body">
                                    <Heart className="h-5 w-5" />
                                    <span>{post.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-body">
                                    <MessageCircle className="h-5 w-5" />
                                    <span>{post.commentsCount || 0}</span>
                                </div>
                                <Button asChild variant="ghost" className="ml-auto font-headline text-primary hover:text-primary">
                                    <Link href={`/publicaciones/${post.id}`}>
                                        Ver más
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Badge variant="destructive">Borrador</Badge>
                                 <Button asChild variant="secondary" className="ml-auto font-headline">
                                    <Link href={`/publicaciones/crear?draftId=${post.id}`}>
                                        <Edit className="mr-2 h-4 w-4"/>
                                        Continuar editando
                                    </Link>
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

export default function PublicationsPage() {
  const { user } = useAuth();
  const [published, setPublished] = useState<Publication[]>([]);
  const [drafts, setDrafts] = useState<Publication[]>([]);
  const [loadingPublished, setLoadingPublished] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  // Fetch published articles
  useEffect(() => {
    const q = query(collection(clientDb, "publications"), where("status", "==", "published"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedPublications: Publication[] = [];
        querySnapshot.forEach((doc) => {
            fetchedPublications.push({ id: doc.id, ...doc.data() } as Publication);
        });
        setPublished(fetchedPublications);
        setLoadingPublished(false);
    }, (error) => {
        console.error("Error fetching published articles:", error);
        setLoadingPublished(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch drafts for the current user
  useEffect(() => {
    if (!user?.uid) {
        setDrafts([]);
        setLoadingDrafts(false);
        return;
    }
    const q = query(
        collection(clientDb, "publications"), 
        where("status", "==", "draft"), 
        where("authorId", "==", user.uid),
        orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedDrafts: Publication[] = [];
        querySnapshot.forEach((doc) => {
            fetchedDrafts.push({ id: doc.id, ...doc.data() } as Publication);
        });
        setDrafts(fetchedDrafts);
        setLoadingDrafts(false);
    }, (error) => {
        console.error("Error fetching drafts:", error);
        setLoadingDrafts(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Centro de Publicaciones</h1>
                <p className="text-muted-foreground font-body">Las últimas noticias, anuncios y artículos de la comunidad.</p>
            </div>
            <Button asChild className="font-headline bg-primary hover:bg-primary/90">
                <Link href="/publicaciones/crear">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Crear Publicación
                </Link>
            </Button>
        </div>

        <Tabs defaultValue="published" className="w-full">
            <TabsList>
                <TabsTrigger value="published">Publicadas</TabsTrigger>
                {user && <TabsTrigger value="drafts">Mis Borradores ({drafts.length})</TabsTrigger>}
            </TabsList>
            <TabsContent value="published" className="mt-4">
                <PublicationList publications={published} loading={loadingPublished} />
            </TabsContent>
            {user && (
                <TabsContent value="drafts" className="mt-4">
                    <PublicationList publications={drafts} loading={loadingDrafts} />
                </TabsContent>
            )}
        </Tabs>
    </div>
  )
}
