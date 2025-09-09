
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, Timestamp, orderBy } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MessagesSquare } from 'lucide-react';
import { Skeleton } from "./ui/skeleton";


// Data structures from Firestore
interface Participant {
    userId: string;
    name: string;
    photoUrl: string;
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

export default function MessagingDropdown() {
    const { user, unreadMessages } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(clientDb, "conversations"),
            where("participantIds", "array-contains", user.uid),
            orderBy("lastUpdatedAt", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recentConversations: Conversation[] = [];
            querySnapshot.forEach((doc) => {
                recentConversations.push({ id: doc.id, ...doc.data() } as Conversation);
            });
            setConversations(recentConversations);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching conversations for dropdown:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getOtherParticipant = (conv: Conversation) => {
        return conv.participants.find(p => p.userId !== user?.uid);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <MessagesSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                        <Badge className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
                           {unreadMessages}
                        </Badge>
                    )}
                    <span className="sr-only">Abrir mensajes</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="font-headline">Mensajes Recientes</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="flex flex-col gap-1 p-1">
                    {loading ? (
                        <div className="px-2 space-y-3 py-2">
                             {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-2/4" />
                                        <Skeleton className="h-3 w-4/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-4 font-body">No tienes mensajes.</p>
                    ) : (
                        conversations.map(conv => {
                            const otherParticipant = getOtherParticipant(conv);
                            return (
                                <Link key={conv.id} href="/mensajes" className="block">
                                    <DropdownMenuItem className="p-2 cursor-pointer h-auto">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={otherParticipant?.photoUrl || undefined} alt={otherParticipant?.name || ''} data-ai-hint="person portrait" />
                                                <AvatarFallback>{otherParticipant?.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-headline text-sm font-semibold truncate">{otherParticipant?.name}</p>
                                                <p className="text-xs text-muted-foreground truncate font-body">{conv.lastMessage?.text}</p>
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                </Link>
                            )
                        })
                    )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mensajes" className="flex items-center justify-center gap-2 py-2 font-headline text-sm w-full">
                    Ver todos en Mensajes
                  </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
