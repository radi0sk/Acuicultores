
"use client";

import { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, Timestamp, increment, getDoc } from "firebase/firestore";
import { clientDb, clientStorage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Paperclip, MoreVertical, MessageCircle, X, Calendar, MapPin, FileText, Check, User, Mail, Phone, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatPlaceholder from "./ChatPlaceholder";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";


// --- Data structures ---
interface Participant {
    userId: string;
    name: string;
    photoUrl: string;
    email?: string;
    phone?: string;
}
interface Conversation {
    id: string;
    participants: Participant[];
    participantIds: string[];
    lastMessage: {
        text: string;
        senderId: string;
        timestamp: Timestamp;
    } | null;
    lastUpdatedAt: Timestamp;
    unreadCounts: { [key: string]: number };
}
interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: Timestamp;
    imageUrl?: string;
}

interface ServiceRequest {
    title: string;
    requestType: string;
    description: string;
    deadline: string;
    location: string;
    address: string;
    from: string;
}

const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: es });
}

interface ProductCardData {
    imageUrl: string;
    title: string;
    price: string;
    message: string;
}

const ProductCard = ({ data }: { data: ProductCardData }) => {
    return (
        <Card className="bg-background my-2 border-primary/50 shadow-sm w-full max-w-sm">
            <CardContent className="p-3">
                <div className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                       {data.imageUrl ? (
                            <Image src={data.imageUrl} alt={data.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col justify-between flex-1">
                        <div>
                            <p className="font-headline font-semibold text-base line-clamp-2">{data.title}</p>
                            <p className="font-headline text-primary text-sm font-bold">{data.price}</p>
                        </div>
                    </div>
                </div>
                {data.message && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-body text-muted-foreground whitespace-pre-wrap">{data.message}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


const ServiceRequestCard = ({ text, onAccept, onReject, onDetails, isRecipient }: { 
    text: string; 
    onAccept: (title: string) => void;
    onReject: (title: string) => void;
    onDetails: (request: ServiceRequest, sender: any) => void;
    isRecipient: boolean;
}) => {
    const [senderProfile, setSenderProfile] = useState<any>(null);

    const parsedRequest = (() => {
        try {
            const lines = text.split('\n');
            const getValue = (key: string) => {
                const line = lines.find(l => l.startsWith(key));
                return line ? line.substring(key.length).trim() : 'No especificado';
            };
            
            const titleLine = lines.find(l => l.startsWith('**')) || '';
            const title = titleLine.substring(2, titleLine.lastIndexOf('**'));
            
            const descriptionIndex = lines.findIndex(l => l.startsWith('**Descripción del Proyecto:**'));
            const deadlineIndex = lines.findIndex(l => l.startsWith('**Fecha Límite Deseada:**'));
            
            let description = 'No especificada';
            if (descriptionIndex !== -1) {
                const endOfDescription = deadlineIndex > descriptionIndex ? deadlineIndex : lines.length;
                description = lines.slice(descriptionIndex + 1, endOfDescription).join('\n').trim();
            }

            return {
                title,
                requestType: titleLine.includes('Presupuesto') ? 'Presupuesto' : titleLine.includes('Asesoría') ? 'Asesoría' : 'General',
                description,
                deadline: getValue('**Fecha Límite Deseada:**'),
                location: getValue('**Ubicación:**'),
                address: getValue('**Dirección (opcional):**'),
                from: getValue('*De: *').replace(/\*/g, ''),
            };
        } catch (e) {
            return null; // Return null if parsing fails
        }
    })();
    
     useEffect(() => {
        const fetchSender = async () => {
            if (!parsedRequest?.from) return;
            // This is a simplification. In a real app you'd query by name or have senderId in the message.
            // For now, let's assume the name is unique for display purposes or we find them in participants.
        };
        fetchSender();
    }, [parsedRequest?.from]);

    if (!parsedRequest) {
        // Render the original text if it cannot be parsed as a request
        return (
            <div className="bg-background my-2 p-3 rounded-lg shadow">
                 <p className="font-body pt-1 whitespace-pre-wrap">{text}</p>
            </div>
        )
    }
    
    return (
        <Card className="bg-background my-2 border-primary shadow-md">
            <CardHeader className="pb-4">
                <CardTitle className="font-headline text-lg">{parsedRequest.title}</CardTitle>
                 <CardDescription className="font-body text-sm pt-1">
                    Solicitud de {parsedRequest.requestType} enviada por {parsedRequest.from}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mt-4 flex gap-2 pt-4 border-t">
                    {isRecipient && (
                        <>
                             <Button size="sm" onClick={() => onAccept(parsedRequest.title)}><Check className="h-4 w-4 mr-2"/>Aceptar</Button>
                             <Button size="sm" variant="destructive" onClick={() => onReject(parsedRequest.title)}><X className="h-4 w-4 mr-2"/>Rechazar</Button>
                        </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onDetails(parsedRequest, senderProfile)}>Ver Detalles</Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function MessagesPage() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [imageToSend, setImageToSend] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    // State for Details Modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [requestSender, setRequestSender] = useState<Participant | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;

        setLoadingConversations(true);
        const q = query(
            collection(clientDb, "conversations"),
            where("participantIds", "array-contains", user.uid),
            orderBy("lastUpdatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userConversations: Conversation[] = [];
            querySnapshot.forEach((doc) => {
                userConversations.push({ id: doc.id, ...doc.data() } as Conversation);
            });
            setConversations(userConversations);
            setLoadingConversations(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoadingConversations(false);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!selectedConversation) return;

        setLoadingMessages(true);
        const q = query(
            collection(clientDb, `conversations/${selectedConversation.id}/messages`),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const conversationMessages: Message[] = [];
            querySnapshot.forEach((doc) => {
                conversationMessages.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(conversationMessages);
            setLoadingMessages(false);
            // Scroll to bottom after messages load
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsubscribe();
    }, [selectedConversation]);

    const sendMessage = async (text: string, imageUrl: string | null = null) => {
        if (!selectedConversation || !user || !userProfile) return;

        const messageContent = text.startsWith('::product-card::') 
            ? 'Consulta sobre producto'
            : imageUrl ? '📷 Imagen' : text;

        const conversationRef = doc(clientDb, "conversations", selectedConversation.id);
        const messagesRef = collection(conversationRef, "messages");
        const recipient = selectedConversation.participants.find(p => p.userId !== user.uid);
        if (!recipient) return;

        await addDoc(messagesRef, {
            senderId: user.uid,
            text,
            imageUrl,
            timestamp: serverTimestamp(),
        });

        const unreadCountKey = `unreadCounts.${recipient.userId}`;
        await updateDoc(conversationRef, {
            lastMessage: { text: messageContent, senderId: user.uid, timestamp: serverTimestamp() },
            lastUpdatedAt: serverTimestamp(),
            [unreadCountKey]: increment(1)
        });
        
        await addDoc(collection(clientDb, "notifications"), {
            userId: recipient.userId,
            type: 'new_message',
            title: `Nuevo mensaje de ${userProfile.name}`,
            body: messageContent,
            link: `/mensajes`,
            isRead: false,
            createdAt: serverTimestamp(),
            senderId: user.uid,
            senderName: userProfile.name,
            senderAvatar: user.photoURL || '',
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageToSend) || !selectedConversation || !user) return;
        
        const currentMessage = newMessage;
        const currentImage = imageToSend;
        
        setNewMessage("");
        setImageToSend(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";

        let finalImageUrl: string | null = null;
        if (currentImage) {
            const imageRef = ref(clientStorage, `chat-images/${selectedConversation.id}/${uuidv4()}-${currentImage.name}`);
            const snapshot = await uploadBytes(imageRef, currentImage);
            finalImageUrl = await getDownloadURL(snapshot.ref);
        }

        await sendMessage(currentMessage, finalImageUrl);
    };
    
    const handleAcceptRequest = async (title: string) => {
        await sendMessage(`He aceptado la solicitud: "${title}". Me pondré en contacto pronto.`);
        toast({ title: "Solicitud Aceptada", description: "Se ha notificado al solicitante." });
    };

    const handleRejectRequest = async (title: string) => {
        await sendMessage(`He rechazado la solicitud: "${title}".`);
        toast({ title: "Solicitud Rechazada", variant: "destructive" });
    };

    const handleViewDetails = async (request: ServiceRequest, sender: any) => {
        if (!selectedConversation) return;
        const senderId = messages.find(m => m.text.includes(request.title))?.senderId;
        const senderData = selectedConversation.participants.find(p => p.userId === senderId);

        if (senderData) {
            const userDoc = await getDoc(doc(clientDb, 'users', senderData.userId));
            if (userDoc.exists()) {
                const fullSenderData = { ...senderData, ...userDoc.data() };
                setRequestSender(fullSenderData);
                setSelectedRequest(request);
                setIsDetailsModalOpen(true);
            }
        }
    };


    const handleSelectConversation = async (conv: Conversation) => {
        setSelectedConversation(conv);
        if (user && conv.unreadCounts?.[user.uid] > 0) {
            const conversationRef = doc(clientDb, "conversations", conv.id);
            await updateDoc(conversationRef, { [`unreadCounts.${user.uid}`]: 0 });
        }
    };
    
    const handleAttachmentClick = () => fileInputRef.current?.click();

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ variant: "destructive", title: "Imagen demasiado grande", description: "La imagen no puede pesar más de 5MB." });
                return;
            }
            setImageToSend(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageToSend(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    const getOtherParticipant = (conv: Conversation) => conv.participants.find(p => p.userId !== user?.uid);

    const parseProductCard = (text: string): ProductCardData | null => {
        if (!text.startsWith('::product-card::')) return null;
        try {
            const parts = text.split('---');
            const header = parts[0];
            const message = parts[1] ? parts[1].trim() : '';

            const lines = header.split('\n').slice(1);
            const data: any = {};
            lines.forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if(key) data[key.trim()] = valueParts.join('=').trim();
            });
            
            return {
                imageUrl: data.image_url || '',
                title: data.title || 'Producto',
                price: data.price || '',
                message: message
            };
        } catch (error) {
            console.error("Failed to parse product card:", error);
            return null;
        }
    };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-[minmax(300px,380px)_1fr] border rounded-lg overflow-hidden bg-card h-[calc(100vh_-_8.5rem)]">
      <div className="flex flex-col border-r bg-background/50 h-full overflow-hidden">
        <div className="p-4 border-b h-16 flex items-center justify-between flex-shrink-0">
          <h1 className="font-headline text-2xl font-bold tracking-tight">Chats</h1>
        </div>
          <div className="p-2 border-b flex-shrink-0">
           <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar un chat o iniciar uno nuevo" className="pl-9 bg-background focus-visible:ring-primary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
                <div className="p-3 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
            <div className="flex flex-col">
                {conversations.map((conv) => {
                    const otherParticipant = getOtherParticipant(conv);
                    return (
                    <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={cn(
                        "flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b",
                        selectedConversation?.id === conv.id && "bg-muted"
                        )}
                    >
                        <Avatar className="h-12 w-12">
                        <AvatarImage src={otherParticipant?.photoUrl || undefined} alt={otherParticipant?.name || ''} data-ai-hint="person portrait" />
                        <AvatarFallback>{otherParticipant?.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <p className="font-headline font-semibold truncate">{otherParticipant?.name}</p>
                            <span className={cn(
                                "text-xs",
                                conv.unreadCounts?.[user?.uid || ''] > 0 ? "text-primary font-bold" : "text-muted-foreground"
                            )}>{formatTimestamp(conv.lastMessage?.timestamp || conv.lastUpdatedAt)}</span>
                        </div>
                        <div className="flex justify-between items-start mt-1">
                            <p className="text-sm text-muted-foreground truncate pr-2 font-body">{conv.lastMessage?.text}</p>
                            {conv.unreadCounts?.[user?.uid || ''] > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">{conv.unreadCounts[user!.uid]}</span>
                            )}
                        </div>
                        </div>
                    </button>
                    )
                })}
            </div>
            )}
        </div>
      </div>

      <div className="flex flex-col bg-secondary/20 h-full overflow-hidden">
        {selectedConversation ? (
                <div className="flex flex-col h-full w-full">
                    <div className="flex flex-row items-center justify-between gap-3 p-3 border-b bg-background h-16 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={getOtherParticipant(selectedConversation)?.photoUrl || undefined} alt={getOtherParticipant(selectedConversation)?.name || ''} data-ai-hint="person portrait"/>
                                <AvatarFallback>{getOtherParticipant(selectedConversation)?.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-headline font-semibold">{getOtherParticipant(selectedConversation)?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5 text-muted-foreground"/>
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                               <div className="p-6">
                                   <div className="flex flex-col gap-4">
                                       {loadingMessages ? (
                                            <div className="flex justify-center items-center h-full">
                                                <MessageCircle className="h-8 w-8 text-muted-foreground animate-pulse"/>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const productCardData = parseProductCard(msg.text);
                                                const isServiceRequest = msg.text.startsWith('**Solicitud');
                                                const isRecipient = msg.senderId !== user?.uid;
                                                return (
                                                    <div key={msg.id} className={cn(
                                                        "flex w-full max-w-[85%] flex-col gap-1",
                                                        msg.senderId === user?.uid ? 'ml-auto items-end' : 'items-start'
                                                    )}>
                                                        {productCardData ? (
                                                            <ProductCard data={productCardData} />
                                                        ) : isServiceRequest ? (
                                                            <ServiceRequestCard 
                                                                text={msg.text} 
                                                                onAccept={handleAcceptRequest}
                                                                onReject={handleRejectRequest}
                                                                onDetails={handleViewDetails}
                                                                isRecipient={isRecipient}
                                                            />
                                                         ) : (
                                                            <div className={cn(
                                                                "rounded-lg px-3 py-2 text-sm w-fit",
                                                                msg.senderId === user?.uid ? 'bg-primary text-primary-foreground shadow' : 'bg-background shadow'
                                                            )}>
                                                                {msg.imageUrl && (
                                                                    <Link href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                                        <Image
                                                                            src={msg.imageUrl}
                                                                            alt="Imagen adjunta"
                                                                            width={250}
                                                                            height={250}
                                                                            className="rounded-md object-cover max-w-full h-auto cursor-pointer"
                                                                            data-ai-hint="attached image"
                                                                        />
                                                                    </Link>
                                                                )}
                                                                {msg.text && <p className="font-body pt-1 whitespace-pre-wrap">{msg.text}</p>}
                                                            </div>
                                                        )}
                                                         <span className={cn(
                                                            "text-xs opacity-80 pt-1",
                                                            msg.senderId === user?.uid ? 'self-end' : 'self-start'
                                                        )}>{formatTimestamp(msg.timestamp)}</span>
                                                    </div>
                                                )
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                   </div>
                               </div>
                    </div>

                    <div className="p-4 border-t bg-background flex-shrink-0">
                        <form onSubmit={handleSendMessage}>
                            {imagePreview && (
                                <div className="relative p-2 border-b mb-2 w-fit">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 z-10"
                                        onClick={handleRemoveImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Image src={imagePreview} alt="Preview" width={80} height={80} className="h-20 w-auto rounded-md object-cover" />
                                </div>
                            )}
                            <div className="relative flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden"/>
                                <Button type="button" size="icon" variant="ghost" onClick={handleAttachmentClick}>
                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                    <span className="sr-only">Adjuntar</span>
                                </Button>
                                <Input 
                                    placeholder="Escribe un mensaje..." 
                                    className="pr-12 rounded-full bg-muted focus-visible:ring-primary"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button type="submit" size="icon" className="absolute right-1" variant="ghost">
                                    <Send className="h-5 w-5 text-muted-foreground" />
                                    <span className="sr-only">Enviar</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
        ) : (
                <ChatPlaceholder />
        )}
      </div>
    </div>
    
    <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Detalles de la Solicitud</DialogTitle>
            </DialogHeader>
            {selectedRequest && requestSender && (
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center gap-3">
                                <Avatar className="h-12 w-12"><AvatarImage src={requestSender.photoUrl} /><AvatarFallback>{requestSender.name.charAt(0)}</AvatarFallback></Avatar>
                                <div>
                                    <p>Solicitante</p>
                                    <p className="text-base font-normal">{requestSender.name}</p>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4"/><span>{requestSender.email || 'No proporcionado'}</span></div>
                            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4"/><span>{requestSender.phone || 'No proporcionado'}</span></div>
                        </CardContent>
                    </Card>

                    <h3 className="font-headline font-semibold text-lg border-b pb-2">{selectedRequest.title}</h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <h4 className="font-headline font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/>Tipo de Solicitud</h4>
                                 <p className="font-body text-muted-foreground">{selectedRequest.requestType}</p>
                            </div>
                            <div>
                                 <h4 className="font-headline font-semibold flex items-center gap-2"><Calendar className="h-4 w-4"/>Fecha Límite Deseada</h4>
                                 <p className="font-body text-muted-foreground">{selectedRequest.deadline}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-headline font-semibold flex items-center gap-2"><MapPin className="h-4 w-4"/>Ubicación</h4>
                            <p className="font-body text-muted-foreground">{selectedRequest.location}</p>
                            {selectedRequest.address !== 'No especificada' && <p className="font-body text-sm text-muted-foreground">{selectedRequest.address}</p>}
                        </div>

                         <div>
                            <h4 className="font-headline font-semibold">Descripción del Proyecto</h4>
                            <p className="text-sm font-body text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-3 rounded-md mt-1">{selectedRequest.description}</p>
                        </div>
                    </div>
                </div>
            )}
            <DialogClose asChild>
                <Button type="button" variant="secondary" className="mt-4">Cerrar</Button>
            </DialogClose>
        </DialogContent>
    </Dialog>
    </>
  );
}
