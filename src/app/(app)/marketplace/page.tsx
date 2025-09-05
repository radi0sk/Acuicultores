
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Tag, Package, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface Product {
    id: string;
    title: string;
    price: number;
    image: string | null;
    images?: string[];
    category: string;
    description: string;
    location: string;
    tags: string[];
    createdAt: Timestamp;
}

const categories = [
    { name: "Todos", key: "all" },
    { name: "Insumos", key: "insumo" },
    { name: "Alevines", key: "alevines" },
    { name: "Equipo", key: "equipo" },
];

export default function MarketplaceBuyPage() {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for immediate input value
  const [searchInputValue, setSearchInputValue] = useState("");
  const [locationInputValue, setLocationInputValue] = useState("");

  // Debounced state for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const q = query(collection(clientDb, "products"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedProducts: Product[] = [];
        querySnapshot.forEach((doc) => {
            fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
        });
        setAllProducts(fetchedProducts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Debounce effect for search query
  useEffect(() => {
    const handler = setTimeout(() => {
        setSearchQuery(searchInputValue);
    }, 300); // 300ms delay

    return () => {
        clearTimeout(handler);
    };
  }, [searchInputValue]);

  // Debounce effect for location filter
  useEffect(() => {
    const handler = setTimeout(() => {
        setLocationFilter(locationInputValue);
    }, 300); // 300ms delay

    return () => {
        clearTimeout(handler);
    };
  }, [locationInputValue]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
        const searchMatch = searchQuery.trim() === '' || 
                              product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const locationMatch = locationFilter.trim() === '' ||
                                product.location.toLowerCase().includes(locationFilter.toLowerCase());

        const categoryMatch = activeCategory === 'all' || product.category === activeCategory;

        return searchMatch && locationMatch && categoryMatch;
    });
  }, [allProducts, searchQuery, locationFilter, activeCategory]);


  return (
    <>
        <aside className="hidden md:flex flex-col gap-4 sticky top-6">
            <div>
                <Button asChild className="w-full font-headline">
                    <Link href="/marketplace/vender">
                        <Tag className="mr-2 h-4 w-4" />
                        Ir a Vender
                    </Link>
                </Button>
            </div>
             <div className="space-y-4 border-t pt-4">
                <h2 className="font-headline font-semibold px-3">Filtros</h2>
                <div className="space-y-2 px-3">
                    <Label htmlFor="location" className="font-body">Ubicación</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="location" 
                          placeholder="Mixco, Guatemala" 
                          className="pl-9" 
                          value={locationInputValue} 
                          onChange={(e) => setLocationInputValue(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="font-body px-3">Categorías</Label>
                    <div className="flex flex-col gap-1">
                        {categories.map(cat => (
                           <Button
                                key={cat.key}
                                variant={activeCategory === cat.key ? "secondary" : "ghost"}
                                className="justify-start font-body"
                                onClick={() => setActiveCategory(cat.key)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>
             </div>
             <div className="px-3 border-t pt-4">
                 <Button asChild className="w-full font-headline" variant="outline">
                     <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Ir al Inicio
                    </Link>
                </Button>
            </div>
        </aside>

        {/* Right Content */}
        <main>
             <div className="flex flex-col gap-2 mb-6">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar alimento, bombas, alevines..." 
                        className="pl-10" 
                        value={searchInputValue}
                        onChange={(e) => setSearchInputValue(e.target.value)}
                    />
                </div>
             </div>
            
            {loading ? (
                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <Skeleton className="aspect-video w-full" />
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                            <CardFooter className="bg-secondary/30 p-4">
                                <Skeleton className="h-8 w-1/3" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden flex flex-col">
                        <CardHeader className="p-0">
                             <div className="aspect-video bg-muted flex items-center justify-center relative">
                                {product.image || (product.images && product.images[0]) ? (
                                    <Image src={(product.image || product.images![0])!} alt={product.title} layout="fill" className="object-cover" />
                                ) : (
                                    <Package className="h-16 w-16 text-muted-foreground" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 flex-grow">
                        <CardTitle className="font-headline text-lg">{product.title}</CardTitle>
                        <CardDescription className="font-body text-sm text-muted-foreground pt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {product.location}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {product.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-body">{tag}</Badge>
                            ))}
                        </div>
                        </CardContent>
                        <CardFooter className="bg-secondary/30 p-4 flex justify-between items-center mt-auto">
                        {user ? (
                            <>
                                <p className="font-headline font-semibold text-lg">Q{product.price.toFixed(2)}</p>
                                <Button size="sm" className="font-headline bg-primary hover:bg-primary/90" asChild>
                                <Link href={`/marketplace/${product.id}`}>
                                    Ver más
                                </Link>
                                </Button>
                            </>
                            ) : (
                            <>
                                <p className="font-body text-sm text-muted-foreground">Inicia sesión para ver</p>
                                <Button size="sm" className="font-headline bg-primary hover:bg-primary/90" asChild>
                                <Link href="/auth">
                                    Ver Precio
                                </Link>
                                </Button>
                            </>
                            )}
                        </CardFooter>
                    </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16">
                    <h3 className="font-headline text-xl">No se encontraron productos</h3>
                    <p className="text-muted-foreground font-body mt-2">Intenta ajustar tu búsqueda o filtros.</p>
                </div>
            )}
        </main>
    </>
  )
}
