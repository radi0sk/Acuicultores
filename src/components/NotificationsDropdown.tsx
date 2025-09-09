
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, Timestamp, updateDoc, doc, orderBy } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Heart } from 'lucide-react';
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    userId: string;
    type: 'new_message' | 'new_comment' | 'new_reply';
    title: string;
    body: string;
    link: string;
    isRead: boolean;
    createdAt: Timestamp;
    senderId: string;
    senderName: string;
    senderAvatar: string;
}

const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: es });
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'new_message':
            return <MessageCircle className="h-4 w-4 text-primary" />;
        case 'new_comment':
        case 'new_reply':
            return <MessageCircle className="h-4 w-4 text-blue-500" />;
        default:
            return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
}

export default function NotificationsDropdown() {
    const { user, unreadNotifications } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(clientDb, "notifications"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allNotifications: Notification[] = [];
            querySnapshot.forEach((doc) => {
                const notif = { id: doc.id, ...doc.data() } as Notification
                allNotifications.push(notif);
            });
            setNotifications(allNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleNotificationClick = async (notif: Notification) => {
        // Mark as read if it's not already
        if (!notif.isRead) {
            const notifRef = doc(clientDb, "notifications", notif.id);
            try {
                await updateDoc(notifRef, { isRead: true });
            } catch (error) {
                console.error("Error marking notification as read:", error);
            }
        }
        // Navigate to the link
        router.push(notif.link);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                        <Badge className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 p-0 text-xs text-white">
                           {unreadNotifications}
                        </Badge>
                    )}
                    <span className="sr-only">Abrir notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96" align="end">
                <DropdownMenuLabel className="font-headline">Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="flex flex-col gap-1 p-1 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="px-2 space-y-3 py-2">
                             {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-3/4" />
                                        <Skeleton className="h-3 w-4/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-4 font-body">No tienes notificaciones nuevas.</p>
                    ) : (
                        notifications.map(notif => (
                            <DropdownMenuItem 
                                key={notif.id} 
                                className={cn("p-2 cursor-pointer h-auto items-start", !notif.isRead && "bg-blue-50 hover:bg-blue-100")}
                                onClick={() => handleNotificationClick(notif)}
                                >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium line-clamp-2">{notif.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 font-body">{notif.body}</p>
                                        <p className="text-xs text-muted-foreground font-body mt-1">{formatTimestamp(notif.createdAt)}</p>
                                    </div>
                                     {!notif.isRead && <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
                 {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/notificaciones" className="flex items-center justify-center gap-2 py-2 font-headline text-sm w-full">
                            Ver todas las notificaciones
                          </Link>
                        </DropdownMenuItem>
                    </>
                 )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
