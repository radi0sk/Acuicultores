
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp, updateDoc, increment, arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Package, Truck, MessageCircle, Heart, ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from '@/lib/utils';


interface ProductData {
    id: string;
    title: string;
    price: number;
    category: string;
    condition: string;
    description: string;
    tags: string[];
    location: string;
    image: string | null;
    images?: string[];
    deliveryOptions: {
        pickup: boolean;
        door: boolean;
    };
    sellerId: string;
    sellerName: string;
    sellerPhotoUrl: string;
    createdAt: Timestamp;
    savedBy?: string[];
    sellerFollowers?: string[];
}

const categoryMap: { [key: string]: string } = {
  insumo: "Insumo",
  alevines: "Alevines / Lotes",
  equipo: "Equipo",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  
  const [requestMessage, setRequestMessage] = useState('¡Hola! ¿Aún está disponible?');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const productId = params.productId as string;

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      const docRef = doc(clientDb, 'products', productId);

      if (user) {
        try {
            await updateDoc(docRef, { viewCount: increment(1) });
        } catch(e) {
             console.warn("Could not increment view count, likely due to rules. This is acceptable for non-owners.", e);
        }
      }

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<ProductData, 'id'>;

        // Fetch seller's followers to check if current user is following
        const sellerDocRef = doc(clientDb, 'users', data.sellerId);
        const sellerDocSnap = await getDoc(sellerDocRef);
        const sellerData = sellerDocSnap.data();

        setProduct({ 
            id: docSnap.id, 
            ...data,
            sellerFollowers: sellerData?.followers || []
        });

        if (user) {
            setHasSaved(data.savedBy?.includes(user.uid) || false);
            setIsFollowing(sellerData?.followers?.includes(user.uid) || false);
        }

      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Producto no encontrado.'})
        router.push('/marketplace');
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId, user, toast, router]);
  
  const handleSave = async () => {
    if (!user || !product || isLiking) return;

    setIsLiking(true);
    const productRef = doc(clientDb, "products", product.id);

    try {
      if (hasSaved) {
        await updateDoc(productRef, {
            saveCount: increment(-1),
            savedBy: arrayRemove(user.uid)
        });
        setHasSaved(false);
      } else {
        await updateDoc(productRef, {
            saveCount: increment(1),
            savedBy: arrayUnion(user.uid)
        });
        setHasSaved(true);
      }
    } catch (error) {
      console.error("Error updating saves:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !product || isFollowProcessing) return;
    setIsFollowProcessing(true);

    const currentUserRef = doc(clientDb, 'users', user.uid);
    const targetUserRef = doc(clientDb, 'users', product.sellerId);

    const batch = writeBatch(clientDb);

    if (isFollowing) {
        batch.update(currentUserRef, { following: arrayRemove(product.sellerId), followingCount: increment(-1) });
        batch.update(targetUserRef, { followers: arrayRemove(user.uid), followersCount: increment(-1) });
    } else {
        batch.update(currentUserRef, { following: arrayUnion(product.sellerId), followingCount: increment(1) });
        batch.update(targetUserRef, { followers: arrayUnion(user.uid), followersCount: increment(1) });
    }

    try {
        await batch.commit();
        setIsFollowing(!isFollowing);
        setProduct(prev => prev ? ({ ...prev, sellerFollowers: isFollowing ? prev.sellerFollowers?.filter(id => id !== user.uid) : [...(prev.sellerFollowers || []), user.uid] }) : null);
        toast({ title: isFollowing ? 'Dejaste de seguir al vendedor' : '¡Vendedor seguido!' });
    } catch (error) {
        console.error("Error following/unfollowing user:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la acción.' });
    } finally {
        setIsFollowProcessing(false);
    }
  };

  const handleSendMessage = async () => {
      if (!user || !userProfile || !product || !requestMessage.trim()) {
          toast({ variant: 'destructive', title: 'Error', description: 'Por favor escribe un mensaje.' });
          return;
      }
      setIsSubmittingRequest(true);
      try {
          const conversationsRef = collection(clientDb, 'conversations');
          const q = query(conversationsRef, where('participantIds', '==', [user.uid, product.sellerId].sort()));
          
          const querySnapshot = await getDocs(q);
          let conversationId: string;

          if (!querySnapshot.empty) {
              conversationId = querySnapshot.docs[0].id;
          } else {
              const newConvData = {
                  participantIds: [user.uid, product.sellerId].sort(),
                  participants: [
                      { userId: user.uid, name: userProfile.name, photoUrl: user.photoURL || '' },
                      { userId: product.sellerId, name: product.sellerName, photoUrl: product.sellerPhotoUrl || '' }
                  ],
                  lastMessage: null,
                  lastUpdatedAt: serverTimestamp(),
                  unreadCounts: { [user.uid]: 0, [product.sellerId]: 0 }
              };
              const newConvDoc = await addDoc(conversationsRef, newConvData);
              conversationId = newConvDoc.id;
          }

          const productImageUrl = product.image || (product.images && product.images[0]) || '';
          
          const formattedMessage = `::product-card::
image_url=${productImageUrl}
title=${product.title}
price=Q${product.price.toFixed(2)}
---
${requestMessage}`;
          
          const messagesRef = collection(clientDb, 'conversations', conversationId, 'messages');
          await addDoc(messagesRef, { senderId: user.uid, text: formattedMessage, timestamp: serverTimestamp() });
          
          const conversationRef = doc(clientDb, 'conversations', conversationId);
          await updateDoc(conversationRef, {
              lastMessage: { text: `Consulta: ${product.title}`, senderId: user.uid, timestamp: serverTimestamp() },
              lastUpdatedAt: serverTimestamp(),
              [`unreadCounts.${product.sellerId}`]: increment(1)
          });

          toast({ title: "Mensaje Enviado", description: `Tu consulta sobre "${product.title}" ha sido enviada.` });
          setIsRequestModalOpen(false);
          setRequestMessage('¡Hola! ¿Aún está disponible?');
          router.push('/mensajes');

      } catch (error) {
          console.error("Error sending message:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
      } finally {
          setIsSubmittingRequest(false);
      }
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="font-headline text-2xl">Producto no encontrado</h1>
        <p className="text-muted-foreground font-body">El producto que buscas no existe o ha sido eliminado.</p>
      </div>
    );
  }
  
  const categoryName = categoryMap[product.category] || product.category;
  const imageGallery = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
  const isOwner = user?.uid === product.sellerId;

  return (
    <>
      <div className="container mx-auto py-8">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Marketplace
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Column */}
          <div>
            <Card className="overflow-hidden">
              {imageGallery.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                      {imageGallery.map((url, index) => (
                          <CarouselItem key={index}>
                              <div className="relative aspect-square bg-muted flex items-center justify-center">
                                  <Image fill={true} src={url} alt={`${product.title} - imagen ${index + 1}`} className="object-cover" />
                              </div>
                          </CarouselItem>
                      ))}
                  </CarouselContent>
                   {imageGallery.length > 1 && (
                      <>
                          <CarouselPrevious className="left-4" />
                          <CarouselNext className="right-4"/>
                      </>
                   )}
                </Carousel>
              ) : (
                <div className="relative aspect-square bg-muted flex items-center justify-center">
                  <Package className="h-32 w-32 text-muted-foreground" />
                </div>
              )}
            </Card>
          </div>

          {/* Details Column */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{categoryName}</Badge>
                <Badge variant="outline">{product.condition === 'nuevo' ? 'Nuevo' : 'Usado'}</Badge>
              </div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold">{product.title}</h1>
              <p className="font-headline text-4xl font-bold text-primary">Q{product.price.toFixed(2)}</p>
            </div>
            
            <Card>
              <CardHeader>
                <h3 className="font-headline text-lg font-semibold">Descripción</h3>
              </CardHeader>
              <CardContent>
                <p className="font-body text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {product.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="font-body">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <h3 className="font-headline text-lg font-semibold">Información del Vendedor</h3>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center justify-between gap-4">
                      <Link href={`/perfil/${product.sellerId}`} className="flex items-center gap-4 group">
                          <Avatar className="h-16 w-16">
                              <AvatarImage src={product.sellerPhotoUrl} alt={product.sellerName} data-ai-hint="person portrait" />
                              <AvatarFallback>{product.sellerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-headline text-lg font-semibold group-hover:underline">{product.sellerName}</p>
                               <p className="font-body text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4"/> {product.location}</p>
                          </div>
                      </Link>
                      {!isOwner && user && (
                          <Button variant={isFollowing ? 'secondary' : 'default'} onClick={handleFollowToggle} disabled={isFollowProcessing}>
                              {isFollowing ? <UserCheck className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4" />}
                              {isFollowing ? 'Siguiendo' : 'Seguir'}
                          </Button>
                      )}
                  </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogTrigger asChild>
                   <Button size="lg" className="w-full font-headline" disabled={isOwner || !user}>
                    <MessageCircle className="mr-2 h-5 w-5" /> Enviar Mensaje
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-headline">Enviar Mensaje a {product.sellerName}</DialogTitle>
                    <DialogDescription className="font-body">
                      Tu mensaje iniciará una conversación sobre el producto: <strong>{product.title}</strong>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <Label htmlFor="request-message" className="font-headline">Tu Mensaje</Label>
                    <Textarea 
                      id="request-message" 
                      rows={5} 
                      placeholder="Ej: ¿Aceptas negociar el precio? ¿Haces envíos a Petén?"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                    <Button onClick={handleSendMessage} disabled={isSubmittingRequest || !requestMessage.trim()}>
                      {isSubmittingRequest ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button size="lg" variant="outline" className="w-full font-headline" onClick={handleSave} disabled={!user || isLiking}>
                <Heart className={cn("mr-2 h-5 w-5", hasSaved && "fill-red-500 text-red-500")} /> 
                {hasSaved ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
            
            <div>
              <h3 className="font-headline font-semibold mb-2">Opciones de entrega</h3>
              <div className="flex flex-col gap-2 font-body text-muted-foreground">
                  {product.deliveryOptions.pickup && <span className="flex items-center gap-2"><Package className="h-5 w-5 text-primary"/> Recogida en persona disponible</span>}
                  {product.deliveryOptions.door && <span className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary"/> Entrega a domicilio disponible</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog>
          {/* ... Dialog for Image Preview ... */}
      </Dialog>
    </>
  );
}
