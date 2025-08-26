
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { clientDb, clientStorage } from '@/lib/firebase/client';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { suggestTags } from '@/ai/flows/suggest-tags-flow';
import { enhancePublication, EnhancePublicationOutput } from '@/ai/flows/enhance-publication-flow';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { BrainCircuit, Book, Save, ArrowLeft, Image as ImageIcon, Type, Video, Trash2, BookOpen, Sparkles, Wand2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


// Define the structure for a content block
export interface ContentBlock {
    id: string;
    type: 'text' | 'image' | 'video';
    value: string; // For text, this is the content. For media, this is the preview URL (local or remote).
    file?: File; // For media, this is the file to be uploaded.
}

// The data that will be stored in Firestore
export interface StoredContentBlock {
    type: 'text' | 'image' | 'video';
    value: string; // For text, it's the content; for media, it's the final URL from Storage
}

export default function CreatePublicationPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const draftId = searchParams.get('draftId');

    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<ContentBlock[]>([{ id: uuidv4(), type: 'text', value: '' }]);
    const [tags, setTags] = useState('');
    const [references, setReferences] = useState('');
    const [isOpenInvestigation, setIsOpenInvestigation] = useState(false);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuggestingTags, setIsSuggestingTags] = useState(false);
    const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId);
    
    const [aiSuggestion, setAiSuggestion] = useState<EnhancePublicationOutput | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [aiCustomPrompt, setAiCustomPrompt] = useState('');

    useEffect(() => {
        if (draftId) {
            const fetchDraft = async () => {
                setIsLoadingDraft(true);
                const docRef = doc(clientDb, 'publications', draftId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().authorId === user?.uid) {
                    const data = docSnap.data();
                    setTitle(data.title || '');
                    setTags(data.tags?.join(', ') || '');
                    setReferences(data.references || '');
                    setIsOpenInvestigation(data.isOpenInvestigation || false);
                    if (Array.isArray(data.content)) {
                        const loadedBlocks = data.content.map((b: StoredContentBlock) => ({ ...b, id: uuidv4() }));
                        setBlocks(loadedBlocks);
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el borrador o no tienes permiso.' });
                    router.push('/publicaciones/crear');
                }
                setIsLoadingDraft(false);
            };
            if (user) fetchDraft();
        }
    }, [draftId, router, toast, user]);


    const addBlock = (type: 'text' | 'image' | 'video') => {
        if (type === 'text') {
            const newBlock: ContentBlock = { id: uuidv4(), type, value: '' };
            setBlocks([...blocks, newBlock]);
        } else {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = type === 'image' ? 'image/*' : 'video/*';
            input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                    const file = target.files[0];
                    if (file.size > 100 * 1024 * 1024) { // 100MB limit
                        toast({ variant: "destructive", title: "Archivo demasiado grande", description: `El archivo excede el límite de 100MB.` });
                        return;
                    }
                    const newMediaBlock: ContentBlock = {
                        id: uuidv4(),
                        type,
                        value: URL.createObjectURL(file),
                        file
                    };
                    setBlocks(prev => [...prev, newMediaBlock]);
                }
            };
            input.click();
        }
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

    const handleSave = async (status: 'published' | 'draft') => {
        if (!user || !userProfile) {
            toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para publicar." });
            return;
        }
        if (status === 'published' && (!title.trim() || blocks.every(b => b.type === 'text' && !b.value.trim()))) {
            toast({ variant: "destructive", title: "Campos requeridos", description: "El título y al menos un bloque de contenido no pueden estar vacíos." });
            return;
        }
        
        setIsProcessing(true);

        try {
            const uploadPromises = blocks.map(async (block): Promise<StoredContentBlock> => {
                if (block.type === 'text') {
                    return { type: 'text', value: block.value };
                }

                // If block.value is already an http(s) URL, no need to upload.
                if (block.value.startsWith('http')) {
                    return { type: block.type, value: block.value };
                }

                const fileName = `publications/${uuidv4()}-${block.file?.name || 'ai-image.png'}`;
                const storageRef = ref(clientStorage, fileName);

                // Handle file uploads from user input
                if (block.file) {
                    const snapshot = await uploadBytes(storageRef, block.file);
                    return { type: block.type, value: await getDownloadURL(snapshot.ref) };
                }
                
                // Handle Data URI uploads (e.g., from AI)
                if (block.value.startsWith('data:')) {
                    const snapshot = await uploadString(storageRef, block.value, 'data_url');
                    return { type: block.type, value: await getDownloadURL(snapshot.ref) };
                }

                // Should not happen, but as a fallback
                return { type: block.type, value: '' };
            });
            
            const uploadedBlocks = await Promise.all(uploadPromises);
            // Filter out empty text blocks before saving
            const storedBlocks = uploadedBlocks.filter(block => !(block.type === 'text' && !block.value.trim()));

            if (status === 'published' && storedBlocks.length === 0) {
                throw new Error("No puedes publicar sin contenido.");
            }

            const publicationData = {
                authorId: user.uid,
                authorName: userProfile.name,
                authorAvatar: user.photoURL || '',
                title,
                content: storedBlocks,
                tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
                references,
                isOpenInvestigation,
                likes: 0,
                commentsCount: 0,
                status, // 'published' or 'draft'
                updatedAt: serverTimestamp(),
            };

            if (draftId) {
                const docRef = doc(clientDb, 'publications', draftId);
                await updateDoc(docRef, { ...publicationData });
            } else {
                 const docRef = await addDoc(collection(clientDb, 'publications'), {
                    ...publicationData,
                    createdAt: serverTimestamp(),
                });
                if (status === 'draft' && !draftId) {
                     router.replace(`/publicaciones/crear?draftId=${docRef.id}`, { scroll: false });
                }
            }

            toast({ title: `¡${status === 'published' ? 'Publicación creada!' : 'Borrador guardado!'}`, description: `Tu artículo ha sido ${status === 'published' ? 'publicado' : 'guardado'}.` });
            if (status === 'published') {
                router.push('/publicaciones');
            }

        } catch (error: any) {
            console.error("Error saving publication:", error);
            toast({ 
                variant: "destructive", 
                title: "Error al guardar", 
                description: error.message || "Ocurrió un problema. Revisa los permisos de Storage."
            });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSuggestTags = async () => {
        if (!title.trim() && blocks.every(b => b.type === 'text' && !b.value.trim())) {
            toast({ variant: "destructive", title: "Contenido insuficiente", description: "Escribe un título o algo de contenido para poder sugerir etiquetas." });
            return;
        }

        setIsSuggestingTags(true);
        try {
            const contentToAnalyze = blocks
                .filter(b => b.type === 'text' && b.value.trim())
                .map(b => b.value)
                .join('\n\n');
            
            const result = await suggestTags({ title, content: contentToAnalyze });
            
            if (result.tags && result.tags.length > 0) {
                setTags(result.tags.join(', '));
                toast({ title: "¡Etiquetas sugeridas!", description: "Se han añadido las etiquetas sugeridas por la IA." });
            } else {
                 toast({ variant: "destructive", title: "No se sugirieron etiquetas", description: "La IA no pudo generar etiquetas para este contenido." });
            }

        } catch (error) {
            console.error("Error suggesting tags:", error);
            toast({ variant: "destructive", title: "Error de IA", description: "No se pudieron generar las etiquetas. Inténtalo de nuevo." });
        } finally {
            setIsSuggestingTags(false);
        }
    };

    const handleEnhanceWithAI = async () => {
        if (!title.trim() && blocks.every(b => b.type === 'text' && !b.value.trim())) {
            toast({ variant: "destructive", title: "Contenido insuficiente", description: "Escribe un título o algo de contenido para que la IA pueda trabajar." });
            return;
        }
        setIsEnhancing(true);
        setAiSuggestion(null);
        try {
            const suggestion = await enhancePublication({
                title,
                content: blocks
                    .filter(b => b.type === 'text' && b.value.trim())
                    .map(b => b.value)
                    .join('\n\n'),
                customInstructions: aiCustomPrompt
            });
            setAiSuggestion(suggestion);
        } catch (error) {
            console.error("Error enhancing publication:", error);
            toast({ variant: "destructive", title: "Error de IA", description: "No se pudo generar la sugerencia. Inténtalo de nuevo." });
        } finally {
            setIsEnhancing(false);
        }
    };

    const applyAISuggestion = () => {
        if (!aiSuggestion) return;
        setTitle(aiSuggestion.improvedTitle);
        
        const newTextBlocks: ContentBlock[] = aiSuggestion.improvedContent
            .split('\n\n')
            .map(paragraph => ({
                id: uuidv4(),
                type: 'text',
                value: paragraph
            }));

        const mediaBlocks = blocks.filter(b => b.type !== 'text');
        
        if (aiSuggestion.generatedImage) {
            mediaBlocks.unshift({
                id: uuidv4(),
                type: 'image',
                value: aiSuggestion.generatedImage.url,
                file: undefined // It's a data URL, not a File object
            });
        }
        
        setBlocks([...newTextBlocks, ...mediaBlocks]);
        setAiSuggestion(null);
        toast({ title: "Sugerencias aplicadas", description: "El contenido ha sido actualizado con la versión de la IA." });
    };

    const isPreviewEmpty = !title && blocks.length === 1 && !blocks[0].value && !tags;

    if (isLoadingDraft) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }
    
    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button asChild variant="outline" size="icon">
                    <Link href="/publicaciones"><ArrowLeft/></Link>
                </Button>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">{draftId ? 'Editar Borrador' : 'Crear Nueva Publicación'}</h1>
                    <p className="text-muted-foreground font-body">Comparte tus conocimientos y hallazgos con la comunidad.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Contenido de la Publicación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-headline">Título</Label>
                                <Input id="title" placeholder="Un título claro y conciso" value={title} onChange={e => setTitle(e.target.value)} className="text-xl font-headline h-12"/>
                            </div>
                             <Separator />

                            {blocks.length === 0 && (
                                <Alert>
                                    <AlertTitle className="font-headline">¡Empieza a construir tu publicación!</AlertTitle>
                                    <AlertDescription className="font-body">Usa los botones de abajo para añadir tu primer bloque de texto, imagen o video.</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-4">
                                {blocks.map((block, index) => (
                                    <div key={block.id} className="relative group/block">
                                        {block.type === 'text' && (
                                            <Textarea 
                                                placeholder="Escribe aquí tu párrafo..." 
                                                rows={5}
                                                value={block.value} 
                                                onChange={e => updateBlockValue(block.id, e.target.value)}
                                                className="font-body text-base leading-relaxed"
                                            />
                                        )}
                                        {block.type === 'image' && (
                                            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                                <Image src={block.value} alt="preview" width={800} height={450} className="w-full h-full object-contain" data-ai-hint="publication image" />
                                            </div>
                                        )}
                                         {block.type === 'video' && (
                                            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                                                <video src={block.value} className="max-w-full max-h-full rounded-lg" controls/>
                                            </div>
                                        )}
                                        <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover/block:opacity-100 z-10">
                                            <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => moveBlock(block.id, 'up')} disabled={index === 0}>
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => moveBlock(block.id, 'down')} disabled={index === blocks.length - 1}>
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeBlock(block.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <Separator/>

                            <div className="flex items-center gap-2">
                                <span className="font-body text-sm text-muted-foreground">Añadir bloque:</span>
                                <Button variant="outline" size="sm" onClick={() => addBlock('text')}><Type className="mr-2 h-4 w-4" /> Texto</Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('image')}><ImageIcon className="mr-2 h-4 w-4" /> Imagen</Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('video')}><Video className="mr-2 h-4 w-4" /> Video</Button>
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Configuración</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="tags" className="font-headline">Etiquetas</Label>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleSuggestTags} 
                                        disabled={isSuggestingTags || isProcessing}
                                        className="font-body"
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {isSuggestingTags ? 'Generando...' : 'Sugerir con IA'}
                                    </Button>
                                </div>
                                <Input id="tags" placeholder="Cosecha, Sostenibilidad..." value={tags} onChange={e => setTags(e.target.value)} />
                                <p className="text-xs text-muted-foreground font-body">Separa las etiquetas con comas.</p>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="open-investigation" className="font-headline flex items-center gap-2"><BrainCircuit className="h-4 w-4"/>Investigación Abierta</Label>
                                    <p className="text-xs text-muted-foreground font-body">
                                        Permite que otros aporten.
                                    </p>
                                </div>
                                <Switch id="open-investigation" checked={isOpenInvestigation} onCheckedChange={setIsOpenInvestigation} />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center gap-2"><Book className="h-5 w-5"/> Referencias</CardTitle>
                            <CardDescription className="font-body">Cita tus fuentes. Escribe una referencia por línea.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Textarea id="references" placeholder="Ej: Smith, J. (2023). Avances en la nutrición de tilapia. Journal of Aquaculture." rows={4} value={references} onChange={e => setReferences(e.target.value)} />
                        </CardContent>
                    </Card>
                    <div className="flex items-center gap-2">
                        <Button size="lg" variant="secondary" className="font-headline" onClick={() => handleSave('draft')} disabled={isProcessing}>
                            {isProcessing ? 'Guardando...' : 'Guardar Borrador'}
                        </Button>
                        <Button size="lg" className="w-full font-headline" onClick={() => handleSave('published')} disabled={isProcessing}>
                            <Save className="mr-2 h-4 w-4"/>
                            {isProcessing ? 'Publicando...' : 'Publicar'}
                        </Button>
                    </div>
                </div>

                <aside className="hidden lg:block lg:col-span-1 sticky top-24">
                     <Label className="font-headline text-muted-foreground px-2">Vista Previa</Label>
                    <div className="mt-2 rounded-xl bg-secondary/50 p-4 border relative">
                        
                         <div className="absolute top-6 right-6 z-10">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isEnhancing} size="sm">
                                        <Wand2 className="mr-2 h-4 w-4"/>
                                        Mejorar con IA
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-headline">Mejorar con IA</AlertDialogTitle>
                                        <AlertDialogDescription className="font-body">
                                            Describe qué te gustaría mejorar. Por ejemplo: "Hazlo más formal", "Enfócate en la tilapia", "Usa un tono más vendedor". Deja en blanco para una mejora general.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Textarea
                                        placeholder="Tus instrucciones aquí..."
                                        value={aiCustomPrompt}
                                        onChange={(e) => setAiCustomPrompt(e.target.value)}
                                    />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleEnhanceWithAI} disabled={isEnhancing}>
                                            {isEnhancing ? 'Analizando...' : 'Generar Sugerencias'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        
                        {isPreviewEmpty ? (
                            <div className="text-center text-muted-foreground py-16">
                                <BookOpen className="h-12 w-12 mx-auto mb-4"/>
                                <p className="font-headline text-lg">Tu artículo aparecerá aquí</p>
                                <p className="font-body text-sm">Completa los campos para ver cómo se verá tu publicación.</p>
                            </div>
                        ) : (
                            <article className="bg-background rounded-lg shadow-md p-6 space-y-4">
                                
                                {isEnhancing && (
                                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20 rounded-lg">
                                        <Wand2 className="h-8 w-8 animate-pulse text-primary"/>
                                        <p className="font-body text-muted-foreground mt-2">La IA está mejorando tu publicación...</p>
                                    </div>
                                )}
                                
                                {aiSuggestion && (
                                     <Card className="absolute -top-4 -right-4 z-20 bg-primary/90 text-primary-foreground shadow-2xl border-2 border-primary w-full max-w-md">
                                        <CardHeader>
                                            <CardTitle className="font-headline text-lg flex items-center gap-2"><Wand2/> Sugerencia de la IA</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-body text-sm">Hemos mejorado tu texto y generado una imagen. ¿Quieres aplicar estos cambios?</p>
                                        </CardContent>
                                        <CardFooter className="flex gap-2">
                                            <Button onClick={applyAISuggestion} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Check className="mr-2 h-4 w-4"/>Aplicar</Button>
                                            <Button onClick={() => setAiSuggestion(null)} variant="ghost">Descartar</Button>
                                        </CardFooter>
                                    </Card>
                                )}

                                <header className="space-y-2">
                                    <h1 className="font-headline text-2xl font-bold">{aiSuggestion?.improvedTitle || title || "Título de tu publicación"}</h1>
                                     <div className="flex items-center gap-4 text-muted-foreground font-body text-sm">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user?.photoURL || ''} alt={userProfile?.name || ''} data-ai-hint="person portrait" />
                                                <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <span>Por {userProfile?.name || "tu nombre"}</span>
                                        </div>
                                        <span>•</span>
                                        <time>ahora</time>
                                    </div>
                                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                        {tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="font-body">{tag}</Badge>
                                        ))}
                                        {isOpenInvestigation && (
                                            <Badge variant="outline" className="flex items-center gap-1 border-yellow-400 bg-yellow-50 text-yellow-800">
                                                <BrainCircuit className="h-3 w-3"/>
                                                Investigación Abierta
                                            </Badge>
                                        )}
                                    </div>
                                </header>
                                <Separator />
                                <div className="prose-sm max-w-none font-body space-y-4">
                                    {aiSuggestion && aiSuggestion.generatedImage && (
                                        <figure className="w-full">
                                            <Image 
                                                src={aiSuggestion.generatedImage.url} 
                                                alt={aiSuggestion.generatedImage.altText}
                                                width={1280} height={720} 
                                                className="rounded-lg object-contain w-full h-auto"
                                                data-ai-hint="ai generated image"
                                            />
                                        </figure>
                                    )}

                                    {aiSuggestion ? (
                                        <p className="whitespace-pre-wrap leading-relaxed">{aiSuggestion.improvedContent}</p>
                                    ) : (
                                         blocks.map((block) => {
                                            if (!block.value.trim() && block.type === 'text') return null;
                                            switch (block.type) {
                                                case 'text':
                                                    return <p key={block.id} className="whitespace-pre-wrap leading-relaxed">{block.value}</p>;
                                                case 'image':
                                                    return (
                                                        <figure key={block.id} className="w-full">
                                                            <Image 
                                                                src={block.value} 
                                                                alt={`Contenido de la publicación`} 
                                                                width={1280} height={720} 
                                                                className="rounded-lg object-contain w-full h-auto"
                                                                data-ai-hint="publication media"
                                                            />
                                                        </figure>
                                                    );
                                                case 'video':
                                                    return (
                                                        <figure key={block.id}>
                                                            <video src={block.value} className="w-full h-auto rounded-lg" controls>
                                                                Tu navegador no soporta la etiqueta de video.
                                                            </video>
                                                        </figure>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })
                                    )}
                                </div>
                            </article>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
