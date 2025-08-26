
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbsUp } from 'lucide-react';

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    text: string;
    createdAt: Timestamp;
    parentId: string | null;
    publicationId: string;
}

interface PublicationAuthor {
    id: string;
    name: string;
}

const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: es });
};

const CommentForm = ({ publicationId, publicationAuthor, parentId = null, onCommentPosted, parentCommentAuthorId }: { publicationId: string, publicationAuthor: PublicationAuthor | null, parentId?: string | null, onCommentPosted: () => void, parentCommentAuthorId?: string | null }) => {
    const { user, userProfile } = useAuth();
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user || !userProfile || !publicationAuthor) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(clientDb, 'publications', publicationId, 'comments'), {
                authorId: user.uid,
                authorName: userProfile.name,
                authorAvatar: user.photoURL || '',
                text,
                parentId,
                publicationId,
                createdAt: serverTimestamp(),
            });

            // Create notification
            const isReply = parentId !== null;
            const notificationRecipient = isReply ? parentCommentAuthorId : publicationAuthor.id;

            // Don't notify if you're commenting on your own stuff
            if (notificationRecipient !== user.uid) {
                 await addDoc(collection(clientDb, "notifications"), {
                    userId: notificationRecipient,
                    type: isReply ? 'new_reply' : 'new_comment',
                    title: isReply ? `${userProfile.name} respondió a tu comentario` : `${userProfile.name} comentó tu publicación`,
                    body: text,
                    link: `/publicaciones/${publicationId}`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                    senderId: user.uid,
                    senderName: userProfile.name,
                    senderAvatar: user.photoURL || '',
                });
            }

            setText('');
            onCommentPosted();
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return (
        <div className="text-sm text-muted-foreground font-body">
            <Link href="/auth" className="text-primary underline">Inicia sesión</Link> para dejar un comentario.
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
                 <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={user.photoURL || ''} alt={userProfile.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{userProfile.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <Textarea 
                    placeholder={parentId ? "Escribe tu respuesta..." : "Escribe tu comentario..."} 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1"
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !text.trim()} className="font-headline">
                    {isSubmitting ? 'Publicando...' : 'Publicar'}
                </Button>
            </div>
        </form>
    );
};

const CommentItem = ({ comment, allComments, publicationId, publicationAuthor }: { comment: Comment, allComments: Comment[], publicationId: string, publicationAuthor: PublicationAuthor | null }) => {
    const [isReplying, setIsReplying] = useState(false);
    const replies = allComments.filter(c => c.parentId === comment.id).sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <Link href={`/perfil/${comment.authorId}`}>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} data-ai-hint="person portrait" />
                        <AvatarFallback>{comment.authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-baseline gap-2">
                        <Link href={`/perfil/${comment.authorId}`} className="font-headline font-semibold hover:underline">{comment.authorName}</Link>
                        <span className="text-xs text-muted-foreground font-body">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="font-body text-sm whitespace-pre-wrap mt-1">{comment.text}</p>
                </div>
            </div>
            <div className="ml-14">
                <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="text-xs font-body">
                    {isReplying ? "Cancelar" : "Responder"}
                </Button>
            </div>
            {isReplying && (
                <div className="ml-14">
                    <CommentForm publicationId={publicationId} parentId={comment.id} onCommentPosted={() => setIsReplying(false)} publicationAuthor={publicationAuthor} parentCommentAuthorId={comment.authorId}/>
                </div>
            )}
            {replies.length > 0 && (
                <div className="ml-8 pl-6 border-l-2 space-y-4">
                    {replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} allComments={allComments} publicationId={publicationId} publicationAuthor={publicationAuthor} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CommentSection({ publicationId, publicationAuthor }: { publicationId: string, publicationAuthor: PublicationAuthor | null }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const commentsQuery = query(
            collection(clientDb, 'publications', publicationId, 'comments'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const fetchedComments: Comment[] = [];
            snapshot.forEach(doc => {
                fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
            });
            setComments(fetchedComments);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [publicationId]);

    const topLevelComments = comments.filter(c => c.parentId === null);

    return (
        <section className="space-y-6">
            <h2 className="font-headline text-2xl font-bold flex items-center gap-2">Discusión y Aportes ({comments.length})</h2>
            <div>
                <CommentForm publicationId={publicationId} onCommentPosted={() => {}} publicationAuthor={publicationAuthor} />
            </div>
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : topLevelComments.length > 0 ? (
                    topLevelComments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} allComments={comments} publicationId={publicationId} publicationAuthor={publicationAuthor} />
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground font-body">
                        <p>No hay comentarios todavía. ¡Sé el primero en opinar!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
