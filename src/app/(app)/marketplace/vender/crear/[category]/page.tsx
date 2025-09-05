
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, MapPin, Package, Truck, Rocket, UploadCloud, X, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { departments, municipalities } from "@/lib/guatemala-data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Link from 'next/link';


const categoryMap: { [key: string]: string } = {
  insumo: "Insumo en Venta",
  alevines: "Alevines o Lotes",
  equipo: "Equipo",
};

export default function NewItemPage() {
  const params = useParams();
  const category = params.category as string;
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("nuevo");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");
  
  const [department, setDepartment] = useState("");
  const [municipality, setMunicipality] = useState("");

  const [deliveryPickup, setDeliveryPickup] = useState(false);
  const [deliveryDoor, setDeliveryDoor] = useState(false);
  const [promote, setPromote] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const progress = (!!title + !!price + !!description + !!department + !!municipality) / 5 * 100;
  const categoryName = categoryMap[category] || "Artículo";

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorData.error || 'Upload failed');
        }

        const { url } = await response.json();
        return url;
    } catch (error: any) {
        console.error("Upload error:", error);
        toast({ variant: "destructive", title: "Error de subida", description: error.message || "No se pudo subir la imagen." });
        return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    const uploadPromises = Array.from(files).map(file => handleUpload(file));
    const results = await Promise.all(uploadPromises);
    const successfulUrls = results.filter((url): url is string => url !== null);
    
    setImageUrls(prev => [...prev, ...successfulUrls]);
    
    setIsUploading(false);
    
    if (successfulUrls.length > 0) {
        toast({ title: "Imágenes subidas", description: `${successfulUrls.length} imagen(es) se ha(n) agregado a la galería.` });
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls(prev => prev.filter(url => url !== urlToRemove));
  };


  const handlePublish = async () => {
    if (!user || !userProfile) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión para poder publicar un producto." });
        return;
    }
    if (progress < 100) {
        toast({ variant: "destructive", title: "Formulario incompleto", description: "Por favor, completa todos los campos requeridos." });
        return;
    }

    setIsPublishing(true);
    try {
        const productData = {
            sellerId: user.uid,
            sellerName: userProfile.name,
            sellerPhotoUrl: user.photoURL || '',
            title,
            price: parseFloat(price) || 0,
            image: imageUrls.length > 0 ? imageUrls[0] : null,
            images: imageUrls,
            category: category,
            condition,
            description,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            sku,
            location: `${municipality}, ${department}`,
            deliveryOptions: {
                pickup: deliveryPickup,
                door: deliveryDoor,
            },
            isPromoted: promote,
            status: 'active',
            createdAt: serverTimestamp(),
            viewCount: 0,
            saveCount: 0,
            savedBy: [],
        };
        
        await addDoc(collection(clientDb, "products"), productData);

        toast({ title: "¡Publicación exitosa!", description: "Tu producto ahora está visible en el marketplace." });
        router.push('/marketplace/vender');

    } catch (error) {
        console.error("Error publishing product:", error);
        toast({ variant: "destructive", title: "Error al publicar", description: "Ocurrió un problema al guardar tu producto. Inténtalo de nuevo." });
    } finally {
        setIsPublishing(false);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start min-h-screen">
       <div className="fixed top-4 left-4 z-20">
         <Button asChild variant="secondary">
            <Link href="/marketplace/vender"><ArrowLeft className="mr-2 h-4 w-4"/> Ir a Tus Publicaciones</Link>
        </Button>
      </div>

      {/* Left Column: Form */}
      <div className="lg:col-span-1 bg-background rounded-lg p-4 md:p-6 overflow-y-auto h-screen no-scrollbar">
        <div className="space-y-6 pt-12">
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-headline text-2xl font-bold">{categoryName}</h1>
            </div>
            
            <div className="flex items-center gap-3 mb-4 border rounded-lg p-3">
                <Avatar>
                    <AvatarImage src={user?.photoURL || ''} alt={userProfile?.name || ''} data-ai-hint="person portrait"/>
                    <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-headline font-semibold">{userProfile?.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                        <span>Publicación en Marketplace</span> • <Globe className="h-3 w-3" /> <span>Público</span>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-base">Detalles del producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="title" className="font-headline">Título *</Label>
                        <Input id="title" placeholder="Ej: Alimento para Tilapia 45kg" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price" className="font-headline">Precio (Q) *</Label>
                            <Input id="price" type="number" placeholder="Ej: 350" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-headline">Categoría</Label>
                            <Input value={categoryName} disabled />
                        </div>
                     </div>
                      <div className="space-y-2">
                        <Label className="font-headline">Imágenes del Producto</Label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {isUploading ? 'Subiendo...' : 'Añadir Imágenes'}
                        </Button>
                        
                        {imageUrls.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
                                {imageUrls.map(url => (
                                    <div key={url} className="p-1 border rounded-md relative w-full aspect-square">
                                        <Image src={url} alt="Vista previa" layout="fill" className="rounded-md object-cover"/>
                                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => handleRemoveImage(url)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="condition" className="font-headline">Estado</Label>
                        <Select value={condition} onValueChange={setCondition}>
                            <SelectTrigger id="condition" className="font-body">
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="nuevo" className="font-body">Nuevo</SelectItem>
                                <SelectItem value="usado-bueno" className="font-body">Usado - Buen estado</SelectItem>
                                <SelectItem value="usado-aceptable" className="font-body">Usado - Aceptable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description" className="font-headline">Descripción *</Label>
                        <Textarea id="description" placeholder="Describe tu producto detalladamente..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tags" className="font-headline">Etiquetas</Label>
                            <Input id="tags" placeholder="Tilapia, Alimento, Nutrición" value={tags} onChange={(e) => setTags(e.target.value)} />
                            <p className="text-xs text-muted-foreground font-body">Separa las etiquetas con comas.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="sku" className="font-headline">SKU (Opcional)</Label>
                            <Input id="sku" placeholder="Código de producto" value={sku} onChange={(e) => setSku(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="font-headline text-base">Ubicación y Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label className="font-headline">Ubicación *</Label>
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
                    <div>
                        <Label className="font-headline">Preferencias de entrega</Label>
                        <div className="space-y-2 mt-2 font-body">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="pickup" checked={deliveryPickup} onCheckedChange={(checked) => setDeliveryPickup(!!checked)} />
                                <Label htmlFor="pickup" className="font-normal flex items-center gap-2"><Package className="h-4 w-4"/>Recogida en persona</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="door" checked={deliveryDoor} onCheckedChange={(checked) => setDeliveryDoor(!!checked)} />
                                <Label htmlFor="door" className="font-normal flex items-center gap-2"><Truck className="h-4 w-4"/>Entrega a domicilio</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                     <CardTitle className="font-headline text-base">Promoción</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="promote" className="font-headline flex items-center gap-2"><Rocket className="h-4 w-4"/>Promocionar publicación</Label>
                            <p className="text-xs text-muted-foreground font-body">
                                Aumenta la visibilidad de tu producto.
                            </p>
                        </div>
                        <Switch id="promote" checked={promote} onCheckedChange={setPromote} />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <Progress value={progress} className="h-2"/>
                <Button size="lg" className="w-full font-headline" disabled={progress < 100 || isPublishing || isUploading} onClick={handlePublish}>
                    {isPublishing ? "Publicando..." : "Publicar"}
                </Button>
            </div>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="hidden lg:block lg:col-span-2 bg-secondary/50 p-6 h-screen sticky top-0">
         <div className="flex items-center justify-center h-full">
            
            {!title && !price && !description && imageUrls.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                     <p className="font-headline text-lg">Tu anuncio en Marketplace</p>
                     <p className="font-body text-sm">A medida que completes los datos, la vista previa de tu publicación aparecerá aquí.</p>
                 </div>
            ) : (
                <Card className="w-full max-w-sm overflow-hidden shadow-lg">
                    <CardHeader className="p-0">
                        {imageUrls.length > 0 ? (
                             <Carousel className="w-full">
                                <CarouselContent>
                                    {imageUrls.map((url, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative bg-muted aspect-video w-full flex items-center justify-center">
                                                <Image src={url} alt={title || "Vista previa del producto"} layout="fill" className="object-cover" />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {imageUrls.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-2" />
                                        <CarouselNext className="right-2"/>
                                    </>
                                )}
                            </Carousel>
                        ) : (
                             <div className="relative bg-muted aspect-video w-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 text-left">
                        <CardTitle className="font-headline text-xl">{title || "Título del producto"}</CardTitle>
                        <p className="font-headline text-2xl font-bold mt-1">{price ? `Q${parseFloat(price).toFixed(2)}` : "Q0.00"}</p>
                        {(municipality || department) && <p className="font-body text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Publicado en {municipality}{municipality && department && ", "}{department}</p>}
                        
                        <div className="border-t my-4"></div>

                        <h3 className="font-headline font-semibold">Detalles</h3>
                        <div className="font-body text-sm text-muted-foreground mt-2 space-y-1">
                            <p><span className="font-medium text-foreground">Estado:</span> {condition === "nuevo" ? "Nuevo" : "Usado"}</p>
                            <p className="whitespace-pre-wrap">{description || "La descripción del producto aparecerá aquí."}</p>
                        </div>

                         {tags && (
                            <>
                                <div className="border-t my-4"></div>
                                <h3 className="font-headline font-semibold">Etiquetas</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.split(',').map(tag => tag.trim()).filter(Boolean).map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="font-body">{tag}</Badge>
                                    ))}
                                </div>
                            </>
                         )}

                        <div className="border-t my-4"></div>

                        <h3 className="font-headline font-semibold">Información del vendedor</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.photoURL || ''} alt={userProfile?.name || ''} data-ai-hint="person portrait"/>
                                <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                            </Avatar>
                            <p className="font-headline font-semibold">{userProfile?.name || "Nombre del Vendedor"}</p>
                        </div>
                    </CardContent>
                    <div className="p-4 bg-secondary/30">
                        <Button className="w-full font-body" disabled>Enviar mensaje</Button>
                    </div>
                </Card>
            )}
            
         </div>
      </div>
    </div>
  );
}
