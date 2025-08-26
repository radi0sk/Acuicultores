
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { suggestTags } from '@/ai/flows/suggest-tags-flow';
import { enhancePublication } from '@/ai/flows/enhance-publication-flow';
import type { EnhancePublicationOutput } from '@/ai/schemas';


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
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadType, setUploadType] = useState<'image' | 'video'>('image');


    useEffect(() => {
        if (draftId && user) {
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
            fetchDraft();
        }
    }, [draftId, router, toast, user]);


    const addBlock = (type: 'text' | 'image' | 'video', url: string = '', file?: File) => {
        const newBlock: ContentBlock = { id: uuidv4(), type, value: url, file };
        setBlocks(prevBlocks => [...prevBlocks, newBlock]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                toast({ variant: "destructive", title: "Archivo demasiado grande", description: `El archivo excede el límite de 100MB.` });
                return;
            }
            const previewUrl = URL.createObjectURL(file);
            addBlock(uploadType, previewUrl, file);
        }
    };
    
    const triggerFileInput = (type: 'image' | 'video') => {
        setUploadType(type);
        fileInputRef.current?.click();
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

                // If block.value is already an http(s) URL (from a previous upload or AI), no need to upload again.
                if (block.value.startsWith('http')) {
                    return { type: block.type, value: block.value };
                }
                
                const formData = new FormData();
                if (block.file) {
                    formData.append('file', block.file);
                } else if (block.value.startsWith('data:')) {
                    // Convert data URL to blob to upload
                    const blob = await (await fetch(block.value)).blob();
                    formData.append('file', blob, 'ai-generated-media');
                } else {
                     return { type: block.type, value: '' }; // Skip if no file/data
                }

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Fallo al subir ${block.type}`);
                }

                const { url } = await response.json();
                return { type: block.type, value: url };
            });
            
            const uploadedBlocks = await Promise.all(uploadPromises);

            const storedBlocks: StoredContentBlock[] = uploadedBlocks
                .filter(block => !(block.type === 'text' && !block.value.trim()))
                .filter(block => block.value) // Ensure no empty media blocks are saved
                .map(block => ({ type: block.type, value: block.value }));

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
                description: error.message || "Ocurrió un problema al guardar la publicación."
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
        
        // Actualizar título y etiquetas
        setTitle(aiSuggestion.title);
        setTags(aiSuggestion.suggestedTags.join(', '));
      
        const newBlocks: ContentBlock[] = [];
        
        // Conservar bloques no textuales existentes (imágenes/videos subidos por el usuario)
        const existingMediaBlocks = blocks.filter(b => b.type !== 'text');
        
        // Agregar imagen generada por IA si existe
        if (aiSuggestion.generatedImageUrl) {
            newBlocks.push({
              id: uuidv4(),
              type: 'image',
              value: aiSuggestion.generatedImageUrl,
              file: undefined,
            });
          }
        
        // Agregar bloques de medios existentes del usuario primero
        newBlocks.push(...existingMediaBlocks);
        
        // Agregar introducción como primer bloque de texto
        newBlocks.push({
          id: uuidv4(),
          type: 'text',
          value: `## Introducción\n\n${aiSuggestion.introduction}`,
        });
        
        // Agregar cada sección
        aiSuggestion.sections.forEach(section => {
          newBlocks.push({
            id: uuidv4(),
            type: 'text',
            value: `## ${section.subtitle}\n\n${section.content}`,
          });
        });
      
        // Agregar conclusión
        newBlocks.push({
          id: uuidv4(),
          type: 'text',
          value: `## Conclusión\n\n${aiSuggestion.conclusion}`,
        });
        
        setBlocks(newBlocks);
        setAiSuggestion(null);
        toast({
          title: "Borrador aplicado",
          description: "El contenido ha sido actualizado con las sugerencias de la IA."
        });
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
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileSelect} 
                                className="hidden" 
                                accept={uploadType === 'image' ? 'image/*' : 'video/*'}
                            />

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
                                        {block.type === 'image' && block.value && (
                                            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                                <Image src={block.value} alt="preview" width={800} height={450} className="w-full h-full object-contain" data-ai-hint="publication image" />
                                            </div>
                                        )}
                                         {block.type === 'video' && block.value && (
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
                                <Button variant="outline" size="sm" onClick={() => addBlock('text', '')}><Type className="mr-2 h-4 w-4" /> Texto</Button>
                                <Button variant="outline" size="sm" onClick={() => triggerFileInput('image')}><ImageIcon className="mr-2 h-4 w-4" /> Imagen</Button>
                                <Button variant="outline" size="sm" onClick={() => triggerFileInput('video')}><Video className="mr-2 h-4 w-4" /> Video</Button>
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
                     <Label className="font-headline text-muted-foreground px-2">Asistente de IA</Label>
                    <div className="mt-2 rounded-xl bg-secondary/50 p-4 border relative">
                        
                         <div className="absolute top-6 right-6 z-10">
                         <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button disabled={isEnhancing} size="sm">
      <Wand2 className="mr-2 h-4 w-4"/>
      Desarrollar tema con IA
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="font-headline">Asistente de Redacción Profesional</AlertDialogTitle>
      <AlertDialogDescription>
          <div className="font-body space-y-2">
              <p>La IA analizará tu título y contenido existente para:</p>
              <ul className="list-disc pl-5 space-y-1">
                  <li>Desarrollar un artículo completo con enfoque en normativas guatemaltecas</li>
                  <li>Mejorar y expandir tu contenido actual sin perder tu voz</li>
                  <li>Generar una imagen profesional relacionada</li>
                  <li>Sugerir etiquetas relevantes</li>
              </ul>
          </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <div className="space-y-2">
      <Label>Instrucciones adicionales (opcional)</Label>
      <Textarea
        placeholder="Ej: Enfocarse en aspectos legales, usar un tono más técnico, etc."
        value={aiCustomPrompt}
        onChange={(e) => setAiCustomPrompt(e.target.value)}
      />
    </div>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleEnhanceWithAI} disabled={isEnhancing}>
        {isEnhancing ? (
          <span className="flex items-center">
            <Wand2 className="h-4 w-4 animate-pulse mr-2"/> Generando...
          </span>
        ) : 'Generar Borrador Profesional'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
                        </div>
                        
                        {isPreviewEmpty && !aiSuggestion && (
                            <div className="text-center text-muted-foreground py-16">
                                <BookOpen className="h-12 w-12 mx-auto mb-4"/>
                                <p className="font-headline text-lg">Tu artículo aparecerá aquí</p>
                                <p className="font-body text-sm">Completa los campos para ver cómo se verá tu publicación.</p>
                            </div>
                        )}
                        
                        {(aiSuggestion || !isPreviewEmpty) && (
                            <article className="bg-background rounded-lg shadow-md p-6 space-y-4">
                                
                                {isEnhancing && (
                                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20 rounded-lg">
                                        <Wand2 className="h-8 w-8 animate-pulse text-primary"/>
                                        <p className="font-body text-muted-foreground mt-2">La IA está generando tu borrador...</p>
                                    </div>
                                )}
                                
                                {aiSuggestion && (
                                     <Card className="absolute -top-4 -right-4 z-20 bg-primary/90 text-primary-foreground shadow-2xl border-2 border-primary w-full max-w-md">
                                        <CardHeader>
                                            <CardTitle className="font-headline text-lg flex items-center gap-2"><Wand2/> Borrador generado por IA</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-body text-sm">Hemos creado un borrador completo. ¿Quieres reemplazar tu contenido actual con esta versión?</p>
                                        </CardContent>
                                        <CardFooter className="flex gap-2">
                                            <Button onClick={applyAISuggestion} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"><Check className="mr-2 h-4 w-4"/>Aplicar</Button>
                                            <Button onClick={() => setAiSuggestion(null)} variant="ghost">Descartar</Button>
                                        </CardFooter>
                                    </Card>
                                )}

                                <header className="space-y-2">
                                    <h1 className="font-headline text-2xl font-bold">{aiSuggestion?.title || title || "Título de tu publicación"}</h1>
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
                                </header>
                                <Separator />
                                <div className="prose-sm max-w-none font-body space-y-4">
                                    
                                    {aiSuggestion ? (
                                        <>
                                            {aiSuggestion.generatedImageUrl && (
                                                 <figure className="w-full my-6">
                                                    <Image 
                                                        src={aiSuggestion.generatedImageUrl} 
                                                        alt={"AI generated image for " + aiSuggestion.title} 
                                                        width={1280} height={720} 
                                                        className="rounded-lg object-contain w-full h-auto"
                                                        data-ai-hint="ai generated image"
                                                    />
                                                </figure>
                                            )}
                                            <p className="whitespace-pre-wrap leading-relaxed font-bold">{aiSuggestion.introduction}</p>
                                            {aiSuggestion.sections.map((section, i) => (
                                                <div key={i}>
                                                    <h3 className="font-headline text-lg font-semibold">{section.subtitle}</h3>
                                                    <p className="whitespace-pre-wrap leading-relaxed">{section.content}</p>
                                                </div>
                                            ))}
                                            <h3 className="font-headline text-lg font-semibold">Conclusión</h3>
                                            <p className="whitespace-pre-wrap leading-relaxed">{aiSuggestion.conclusion}</p>
                                        </>
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
