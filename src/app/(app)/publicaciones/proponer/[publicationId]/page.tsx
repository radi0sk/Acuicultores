
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

import { BrainCircuit, ArrowLeft, Type, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

import type { ContentBlock, StoredContentBlock } from '../../crear/page';

export default function ProposeChangePage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    
    const publicationId = params.publicationId as string;

    const [originalPublication, setOriginalPublication] = useState<{title: string, authorId: string} | null>(null);
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [suggestionComment, setSuggestionComment] = useState('');
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (publicationId && user) {
            const fetchPublication = async () => {
                setIsLoading(true);
                const docRef = doc(clientDb, 'publications', publicationId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.authorId === user.uid) {
                        toast({ variant: 'destructive', title: 'Acción no permitida', description: 'No puedes proponer cambios a tu propia publicación.' });
                        router.push(`/publicaciones/${publicationId}`);
                        return;
                    }
                    
                    setOriginalPublication({ title: data.title || '', authorId: data.authorId });
                    setTitle(data.title || '');
                    if (Array.isArray(data.content)) {
                        const loadedBlocks = data.content.map((b: StoredContentBlock) => ({ ...b, id: uuidv4() }));
                        setBlocks(loadedBlocks.filter(b => b.type === 'text'));
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la publicación original.' });
                    router.push('/publicaciones');
                }
                setIsLoading(false);
            };
            fetchPublication();
        }
    }, [publicationId, router, toast, user]);

    const addBlock = (type: 'text') => {
        const newBlock: ContentBlock = { id: uuidv4(), type, value: '' };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlockValue = (id: string, value: string) => {
        setBlocks(blocks.map(block => block.id === id ? { ...block, value } : block));
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(block => block.id !== id));
    };

    const moveBlock = (id: string, direction: 'up' | 'down') => {
        const index = blocks.findIndex(block => block.id === id);
        if (index === -1) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= blocks.length) return;
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(index, 1);
        newBlocks.splice(newIndex, 0, removed);
        setBlocks(newBlocks);
    };

    const handleSubmitSuggestion = async () => {
        if (!user || !userProfile || !originalPublication) {
            toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión." });
            return;
        }
        if (!suggestionComment.trim()) {
            toast({ variant: "destructive", title: "Comentario requerido", description: "Debes explicar tu propuesta de cambio." });
            return;
        }
        
        setIsProcessing(true);
        try {
            const storedBlocks = blocks
                .filter(block => !(block.type === 'text' && !block.value.trim()) && block.value)
                .map(block => ({ type: block.type, value: block.value }));

            const suggestionData = {
                originalPublicationId: publicationId,
                publicationAuthorId: originalPublication.authorId,
                suggesterId: user.uid,
                suggesterName: userProfile.name,
                suggesterAvatar: user.photoURL || '',
                suggestedTitle: title,
                suggestedContent: storedBlocks,
                suggestionComment,
                status: 'pending',
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(clientDb, 'publicationSuggestions'), suggestionData);

            toast({ title: '¡Propuesta enviada!', description: 'Tu sugerencia ha sido enviada al autor para su revisión.' });
            router.push(`/publicaciones/${publicationId}`);
        } catch (error) {
            console.error("Error submitting suggestion:", error);
            toast({ variant: "destructive", title: "Error al enviar", description: "Ocurrió un problema al guardar tu propuesta." });
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto p-4">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        )
    }
    
    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-6 py-8 px-4">
            <div className="flex items-center gap-4">
                 <Button asChild variant="outline" size="icon">
                    <Link href={`/publicaciones/${publicationId}`}><ArrowLeft/></Link>
                </Button>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Proponer Cambios</h1>
                    <p className="text-muted-foreground font-body">Estás editando: <span className="font-medium text-primary">{originalPublication?.title}</span></p>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">Edita el Contenido</CardTitle>
                        <CardDescription>Modifica el título y los bloques de contenido como consideres necesario.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-headline">Título</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="text-xl font-headline h-12"/>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            {blocks.map((block, index) => (
                                <div key={block.id} className="relative group/block">
                                    {block.type === 'text' && (
                                        <Textarea placeholder="Escribe aquí tu párrafo..." rows={5} value={block.value} onChange={e => updateBlockValue(block.id, e.target.value)} className="font-body text-base leading-relaxed"/>
                                    )}
                                    <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover/block:opacity-100 z-10">
                                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => moveBlock(block.id, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => moveBlock(block.id, 'down')} disabled={index === blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeBlock(block.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator/>
                        <div className="flex items-center gap-2">
                            <span className="font-body text-sm text-muted-foreground">Añadir bloque:</span>
                            <Button variant="outline" size="sm" onClick={() => addBlock('text')}><Type className="mr-2 h-4 w-4" /> Texto</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">Justifica tu Propuesta</CardTitle>
                        <CardDescription>Deja un comentario para el autor explicando por qué estás sugiriendo estos cambios. (Requerido)</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Textarea 
                            id="suggestion-comment" 
                            placeholder="Ej: Corregí algunos datos técnicos sobre la calidad del agua y añadí una imagen más representativa." 
                            rows={4} 
                            value={suggestionComment} 
                            onChange={e => setSuggestionComment(e.target.value)} 
                         />
                    </CardContent>
                </Card>
                
                <div className="flex items-center gap-2">
                    <Button size="lg" className="w-full font-headline" onClick={handleSubmitSuggestion} disabled={isProcessing || !suggestionComment.trim()}>
                        <BrainCircuit className="mr-2 h-4 w-4"/>
                        {isProcessing ? 'Enviando Propuesta...' : 'Enviar Propuesta'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
