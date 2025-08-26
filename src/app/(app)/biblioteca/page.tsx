
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, FileText, BookCopy, Users, TestTube2, Scale, Download, PlusCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { collection, query, where, onSnapshot, Timestamp, orderBy } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { Skeleton } from "@/components/ui/skeleton"

interface LibraryItem {
  id: string;
  title: string;
  authors: string[];
  category: string;
  tags: string[];
  summary: string;
  fileType: string;
  fileUrl: string;
  contributorId: string;
  contributorName: string;
  contributorAvatar: string;
  createdAt: Timestamp;
}

const categoryConfig = {
    estudios: { label: "Estudios Científicos", icon: TestTube2, value: "estudios" },
    reglamentos: { label: "Reglamentos", icon: Scale, value: "reglamentos" },
    documentos: { label: "Docs. Técnicos", icon: FileText, value: "documentos" },
    publicaciones: { label: "Publicaciones", icon: BookCopy, value: "publicaciones" },
    colaboradores: { label: "Colaboradores", icon: Users, value: "colaboradores" },
} as const;

type CategoryKey = keyof typeof categoryConfig;

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryKey | 'all'>('all');
  const [documents, setDocuments] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(clientDb, "libraryContributions"), 
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedDocs: LibraryItem[] = [];
      snapshot.forEach(doc => {
        fetchedDocs.push({ id: doc.id, ...doc.data() } as LibraryItem);
      });
      setDocuments(fetchedDocs);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching library contributions:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => {
    return documents.filter(item => {
      const lowercasedQuery = searchQuery.toLowerCase();
      
      const categoryMatch = activeTab === 'all' || item.category === activeTab;
      
      const searchMatch = searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(lowercasedQuery) ||
        item.summary.toLowerCase().includes(lowercasedQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)) ||
        item.authors.some(author => author.toLowerCase().includes(lowercasedQuery));
        
      return categoryMatch && searchMatch;
    });
  }, [searchQuery, activeTab, documents]);


  const renderItems = (items: LibraryItem[]) => {
    if (loading) {
        return (
             <div className="grid grid-cols-1 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-7 w-full" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="flex-shrink-0 flex sm:flex-col justify-start items-center gap-2">
                                <Skeleton className="h-10 w-40" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )
    }


    if (items.length === 0) {
        return (
            <div className="text-center py-12 col-span-full">
                <h3 className="font-headline text-xl">No se encontraron resultados</h3>
                <p className="text-muted-foreground font-body mt-2">Intenta con otra búsqueda o en otra categoría.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {items.map((item) => (
                <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-3">
                             <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="font-body text-primary border-primary/50 bg-primary/10 capitalize">{item.category}</Badge>
                                <span className="text-sm text-muted-foreground uppercase">{item.fileType}</span>
                            </div>
                            <CardTitle className="font-headline text-xl">
                                <Link href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                    {item.title}
                                </Link>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Link href={`/perfil/${item.contributorId}`} className="flex items-center gap-2 group">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={item.contributorAvatar} alt={item.contributorName} data-ai-hint="person company" />
                                        <AvatarFallback>{item.contributorName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-muted-foreground group-hover:underline">{item.contributorName}</span>
                                </Link>
                            </div>
                            <p className="font-body text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {item.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="font-body text-xs">{tag}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex sm:flex-col justify-start items-center gap-2 pt-4 sm:pt-0">
                             <Button asChild className="w-full sm:w-48">
                                <Link href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <BookCopy className="mr-2 h-4 w-4" /> Leer / Abrir Recurso
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">Biblioteca de Conocimiento</h1>
            <p className="text-muted-foreground font-body">Tu centro de aprendizaje para todo lo relacionado con la acuicultura.</p>
        </div>
         <Button asChild>
            <Link href="/biblioteca/aportar">
              <PlusCircle className="mr-2 h-4 w-4"/>
              Aportar Documento
            </Link>
        </Button>
      </div>

       <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Busca por título, resumen o etiqueta (ej: Tilapia, RAS, Normativa)" 
                className="pl-10" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CategoryKey | 'all')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="all" className="font-headline"><BookCopy className="mr-2 h-4 w-4" />Todo</TabsTrigger>
          {Object.entries(categoryConfig).map(([key, {label, icon: Icon}]) => (
             <TabsTrigger key={key} value={key} className="font-headline"><Icon className="mr-2 h-4 w-4" />{label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
            {renderItems(filteredItems)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
