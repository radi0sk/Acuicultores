
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, Timestamp, updateDoc, doc, orderBy, writeBatch } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, MessageCircle, Heart, CheckCheck } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    userId: string;
    type: 'new_message' | 'new_comment' | 'new_reply' | 'publication_like';
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
            return <MessageCircle className="h-5 w-5 text-primary" />;
        case 'new_comment':
        case 'new_reply':
            return <MessageCircle className="h-5 w-5 text-blue-500" />;
        case 'publication_like':
            return <Heart className="h-5 w-5 text-red-500" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
}

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        // Simplified query to avoid complex indexes. Sorting will be handled client-side.
        const q = query(
            collection(clientDb, "notifications"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allNotifications: Notification[] = [];
            querySnapshot.forEach((doc) => {
                allNotifications.push({ id: doc.id, ...doc.data() } as Notification);
            });
            // Sort notifications by creation date on the client
            allNotifications.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setNotifications(allNotifications);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.isRead) {
            const notifRef = doc(clientDb, "notifications", notif.id);
            try {
                await updateDoc(notifRef, { isRead: true });
            } catch (error) {
                console.error("Error marking notification as read:", error);
            }
        }
        router.push(notif.link);
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        
        const unreadNotifications = notifications.filter(n => !n.isRead);
        if (unreadNotifications.length === 0) return;

        const batch = writeBatch(clientDb);
        unreadNotifications.forEach(notif => {
            const notifRef = doc(clientDb, "notifications", notif.id);
            batch.update(notifRef, { isRead: true });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="font-headline text-2xl">Notificaciones</CardTitle>
                    <p className="text-muted-foreground font-body text-sm">
                        {notifications.length > 0 
                            ? `Tienes ${unreadCount} notificaciones sin leer.`
                            : 'No tienes notificaciones.'
                        }
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                    <CheckCheck className="mr-2 h-4 w-4"/>
                    Marcar todo como leído
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    {loading ? (
                         <div className="space-y-3 py-2">
                             {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4"/>
                            <p className="font-body">Todo está al día.</p>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-lg cursor-pointer border-b last:border-b-0",
                                    !notif.isRead ? "bg-blue-50/50 hover:bg-blue-100/60" : "hover:bg-secondary/50"
                                )}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <div className="mt-1 flex-shrink-0">
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium font-body line-clamp-2">{notif.title}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2 font-body">{notif.body}</p>
                                    <p className="text-xs text-muted-foreground font-body mt-1">{formatTimestamp(notif.createdAt)}</p>
                                </div>
                                {!notif.isRead && <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0 self-center" />}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
