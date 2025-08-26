
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UploadCloud, FileText, X, Link as LinkIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestTags } from "@/ai/flows/suggest-tags-flow";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";


export default function AportarDocumentoPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [category, setCategory] = useState('');
    const [summary, setSummary] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuggestingTags, setIsSuggestingTags] = useState(false);
    
    // State for both file and URL
    const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState('');


    const uploadFile = async (fileToUpload: File) => {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload file');
            }
            const { url, type } = await response.json();
            return { url, resourceType: type };
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al subir archivo',
                description: error.message
            });
            return null;
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !authors || !category || !summary || !tags || (uploadType === 'file' && !file) || (uploadType === 'url' && !fileUrl)) {
            toast({
                variant: 'destructive',
                title: 'Campos incompletos',
                description: 'Por favor, rellena todos los campos y proporciona un archivo o una URL válida.',
            });
            return;
        }

        if (!user || !userProfile) {
             toast({
                variant: 'destructive',
                title: 'No autenticado',
                description: 'Debes iniciar sesión para poder aportar un documento.',
            });
            return;
        }
        
        setIsSubmitting(true);
        try {
            let finalFileUrl = fileUrl;
            let resourceType = 'url';

            if (uploadType === 'file' && file) {
                const uploadResult = await uploadFile(file);
                if (!uploadResult) {
                    setIsSubmitting(false);
                    return; // Stop if upload fails
                }
                finalFileUrl = uploadResult.url;
                resourceType = uploadResult.resourceType;
            }

            const isAdmin = user.uid === 'ovPIwCma4pcnWk9RnCF4GQEhfJm2';
            const status = isAdmin ? 'approved' : 'pending';
            
            const contributionData = {
                title,
                authors: authors.split(',').map(a => a.trim()),
                category,
                summary,
                tags: tags.split(',').map(t => t.trim()),
                fileUrl: finalFileUrl,
                fileName: file?.name || null,
                fileType: resourceType,
                contributorId: user.uid,
                contributorName: userProfile.name,
                contributorAvatar: user.photoURL || '',
                status,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(clientDb, 'libraryContributions'), contributionData);

            toast({
                title: '¡Gracias por tu aporte!',
                description: isAdmin 
                    ? 'Tu documento ha sido aprobado y publicado automáticamente.'
                    : 'Tu documento ha sido enviado para revisión. Será visible en la biblioteca una vez aprobado.',
            });
            router.push('/biblioteca');

        } catch (error) {
            console.error("Error submitting document:", error);
            toast({
                variant: 'destructive',
                title: 'Error al enviar',
                description: 'Hubo un problema al guardar tu documento. Por favor, inténtalo de nuevo.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
             if (selectedFile.type === "application/pdf" || selectedFile.type.includes("word")) {
                setFile(selectedFile);
                setFileUrl(''); // Clear URL if a file is selected
             } else {
                toast({
                    variant: "destructive",
                    title: "Formato no permitido",
                    description: "Por favor, sube un archivo PDF o Word."
                });
             }
        }
    };
    
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileUrl(e.target.value);
        setFile(null); // Clear file if a URL is being typed
    }

    const handleSuggestTags = async () => {
        if (!title.trim() && !summary.trim()) {
            toast({ variant: 'destructive', title: 'Contenido insuficiente', description: 'Por favor, escribe un título y un resumen para sugerir etiquetas.' });
            return;
        }

        setIsSuggestingTags(true);
        try {
            const result = await suggestTags({ title, content: summary });
            if (result.tags && result.tags.length > 0) {
                setTags(result.tags.join(', '));
                toast({ title: '¡Etiquetas sugeridas!', description: 'Se han rellenado las etiquetas con las sugerencias de la IA.' });
            } else {
                toast({ title: 'No se encontraron sugerencias', description: 'No pudimos generar etiquetas para este contenido.' });
            }
        } catch (error) {
            console.error('Error suggesting tags:', error);
            toast({ variant: 'destructive', title: 'Error de IA', description: 'Hubo un problema al generar las etiquetas.' });
        } finally {
            setIsSuggestingTags(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <Button asChild variant="outline" className="mb-6">
                <Link href="/biblioteca"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Biblioteca</Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Aportar un Documento</CardTitle>
                    <CardDescription className="font-body">
                        Comparte conocimiento con la comunidad. Tu documento será revisado antes de ser publicado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <Tabs defaultValue="file" onValueChange={(value) => setUploadType(value as 'file' | 'url')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="file" className="font-headline"><UploadCloud className="mr-2 h-4 w-4"/>Subir Archivo</TabsTrigger>
                                <TabsTrigger value="url" className="font-headline"><LinkIcon className="mr-2 h-4 w-4"/>Enlazar URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="file" className="pt-4">
                                <div className="space-y-2">
                                     <Label className="font-headline">Archivo (PDF o Word)</Label>
                                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                                     <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                         <UploadCloud className="mr-2 h-4 w-4" />
                                         {file ? 'Cambiar archivo' : 'Seleccionar archivo'}
                                     </Button>
                                     {file && (
                                        <div className="flex items-center justify-between p-2 border rounded-md bg-secondary text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-5 w-5"/>
                                                <span className="font-medium">{file.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}><X className="h-4 w-4"/></Button>
                                        </div>
                                     )}
                                </div>
                            </TabsContent>
                             <TabsContent value="url" className="pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fileUrl" className="font-headline">URL del Documento</Label>
                                    <Input 
                                        id="fileUrl" 
                                        value={fileUrl} 
                                        onChange={handleUrlChange} 
                                        placeholder="https://ejemplo.com/documento.pdf"
                                        type="url"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-headline">Título del Documento *</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Manual de Buenas Prácticas para Tilapia" required />
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="authors" className="font-headline">Autor(es) *</Label>
                            <Input id="authors" value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Ej: Ministerio de Agricultura, 2023" required />
                            <p className="text-xs text-muted-foreground font-body">Separa los autores con comas.</p>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="category" className="font-headline">Categoría *</Label>
                            <Select value={category} onValueChange={setCategory} required>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="estudios">Estudio científico</SelectItem>
                                    <SelectItem value="reglamentos">Reglamento o normativa</SelectItem>
                                    <SelectItem value="documentos">Documento técnico</SelectItem>
                                    <SelectItem value="publicaciones">Publicación o artículo</SelectItem>
                                    <SelectItem value="colaboradores">Aporte de Colaborador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="summary" className="font-headline">Resumen Breve *</Label>
                            <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Unas pocas líneas describiendo el contenido del documento." required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags" className="font-headline">Etiquetas *</Label>
                            <div className="flex items-center gap-2">
                                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ej: Tilapia, BPA, Manual" className="flex-1" required />
                                <Button type="button" variant="outline" size="icon" onClick={handleSuggestTags} disabled={isSuggestingTags}>
                                    <Sparkles className={`h-4 w-4 ${isSuggestingTags ? 'animate-pulse' : ''}`} />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground font-body">Separa las etiquetas con comas.</p>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Enviar Aporte para Revisión'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
