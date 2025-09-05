
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clientDb } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp, serverTimestamp, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from 'next/image';

import { 
    PlusCircle, 
    Package, 
    Search,
    LayoutGrid,
    List,
    MoreHorizontal,
    RefreshCw,
    Share2,
    Pencil,
    Trash2,
    Eye,
    EyeOff
} from "lucide-react"

// Define the product type
interface Product {
    id: string;
    title: string;
    price: number;
    image: string | null;
    images?: string[];
    status: 'active' | 'sold';
    createdAt: Timestamp | null;
    sellerId: string;
}


export default function MarketplaceSellPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const q = query(
        collection(clientDb, "products"), 
        where("sellerId", "==", user.uid),
        orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userProducts: Product[] = [];
        querySnapshot.forEach((doc) => {
            userProducts.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(userProducts);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar tus publicaciones." });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(product => 
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const toggleStatus = async (productId: string, currentStatus: 'active' | 'sold') => {
      const newStatus = currentStatus === 'active' ? 'sold' : 'active';
      const productRef = doc(clientDb, "products", productId);
      try {
          await updateDoc(productRef, { status: newStatus });
          toast({ title: "¡Éxito!", description: `El producto ha sido marcado como ${newStatus === 'active' ? 'activo' : 'agotado'}.`});
      } catch (error) {
          console.error("Error updating status:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del producto." });
      }
  };

  const renewProduct = async (productId: string) => {
      const productRef = doc(clientDb, "products", productId);
      try {
          await updateDoc(productRef, { createdAt: serverTimestamp() });
          toast({ title: "¡Éxito!", description: "Tu publicación ha sido renovada y aparecerá al principio de los listados."});
      } catch (error) {
          console.error("Error renewing product:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo renovar la publicación." });
      }
  };
  
  const deleteProduct = async (productId: string) => {
      const productRef = doc(clientDb, "products", productId);
      try {
          await deleteDoc(productRef);
          toast({ title: "Publicación eliminada", description: "Tu producto ha sido eliminado exitosamente." });
      } catch (error) {
          console.error("Error deleting product:", error);
          toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el producto." });
      }
  };

  const shareProduct = (productId: string) => {
      const url = `${window.location.origin}/marketplace/${productId}`;
      navigator.clipboard.writeText(url).then(() => {
          toast({ title: "Enlace copiado", description: "El enlace a tu publicación ha sido copiado al portapapeles." });
      }).catch(err => {
          console.error("Failed to copy link:", err);
          toast({ variant: "destructive", title: "Error", description: "No se pudo copiar el enlace." });
      });
  };

  const formatDate = (timestamp: Timestamp | null) => {
      if (!timestamp) return 'Fecha desconocida';
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: es });
  }

  return (
    <main>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">Tus Publicaciones</h2>
                <p className="text-muted-foreground font-body">Gestiona los productos que tienes a la venta.</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar en tus publicaciones" 
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant={viewMode === 'list' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4" />
                </Button>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>
        </div>
        
        {loading && (
            <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>
        )}

        {!loading && filteredProducts.length === 0 && (
            <Card className="flex flex-col items-center justify-center text-center p-12 border-dashed">
                <CardHeader>
                    <div className="mx-auto bg-secondary rounded-full p-4">
                        <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="font-headline mt-4">
                       {products.length > 0 ? 'No se encontraron publicaciones' : 'Aún no tienes publicaciones'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="font-body">
                       {products.length > 0 ? 'Intenta con otra búsqueda.' : '¡Crea tu primera publicación para empezar a vender tus productos a la comunidad!'}
                    </CardDescription>
                </CardContent>
                {products.length === 0 && (
                    <Button asChild className="font-headline bg-primary hover:bg-primary/90 mt-4">
                            <Link href="/marketplace/vender/crear">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Publicación
                        </Link>
                    </Button>
                )}
            </Card>
        )}

        {!loading && filteredProducts.length > 0 && (
            <>
                {viewMode === 'list' ? (
                    <div className="space-y-4">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="p-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="w-full sm:w-32 h-32 bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                                        {product.image ? (
                                            <Image src={product.image} alt={product.title} layout="fill" className="object-cover" />
                                        ) : (
                                            <Package className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h3 className="font-headline font-semibold text-lg">{product.title}</h3>
                                        <p className="font-headline text-xl font-bold text-primary">Q{product.price.toFixed(2)}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                                            <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="capitalize">{product.status === 'active' ? 'Activo' : 'Agotado'}</Badge>
                                            <span>•</span>
                                            <span>Publicado {formatDate(product.createdAt)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <Button size="sm" onClick={() => toggleStatus(product.id, product.status)}>
                                                {product.status === 'active' ? <><EyeOff className="mr-2 h-4 w-4"/> Marcar como agotado</> : <><Eye className="mr-2 h-4 w-4"/> Marcar como disponible</>}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => renewProduct(product.id)}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Renovar
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => shareProduct(product.id)}>
                                                <Share2 className="mr-2 h-4 w-4" />
                                                Compartir
                                            </Button>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="self-start -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/marketplace/vender/editar/${product.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    <span>Editar</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Eliminar</span>
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-headline">¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription className="font-body">
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente tu publicación.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90 font-body">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="flex flex-col overflow-hidden">
                                <CardHeader className="p-0 relative">
                                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                                        {product.image || (product.images && product.images[0]) ? (
                                            <Image src={(product.image || product.images![0])!} alt={product.title} layout="fill" className="object-cover" />
                                        ) : (
                                            <Package className="h-16 w-16 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleStatus(product.id, product.status)}>
                                                    {product.status === 'active' ? <EyeOff className="mr-2 h-4 w-4"/> : <Eye className="mr-2 h-4 w-4"/>}
                                                    <span>{product.status === 'active' ? 'Marcar agotado' : 'Marcar disponible'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => renewProduct(product.id)}>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    <span>Renovar</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => shareProduct(product.id)}>
                                                    <Share2 className="mr-2 h-4 w-4" />
                                                    <span>Compartir</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/marketplace/vender/editar/${product.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        <span>Editar</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 w-full">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Eliminar</span>
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle className="font-headline">¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription className="font-body">
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente tu publicación.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90 font-body">Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow space-y-1">
                                    <h3 className="font-headline font-semibold text-base leading-tight">{product.title}</h3>
                                    <p className="font-headline text-lg font-bold text-primary">Q{product.price.toFixed(2)}</p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground font-body">
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="capitalize">{product.status === 'active' ? 'Activo' : 'Agotado'}</Badge>
                                    <span>{formatDate(product.createdAt)}</span>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </>
        )}
    </main>
  )
}
