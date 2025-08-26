
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clientDb } from "@/lib/firebase/client";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove, runTransaction, Timestamp, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import Link from 'next/link';
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Video, BarChartHorizontalBig, X, PlusCircle, Timer, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import CommentSection from "./CommentSection";
import { formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

const POSTS_PER_PAGE = 5;

interface PollOption {
    text: string;
    votes: number;
}

interface CourseData {
    title: string;
    description: string;
    instructor: string;
    price: number;
    isFree: boolean;
    url: string;
    imageUrl: string | null;
}
interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    title: string | null;
    content: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'video' | null;
    type: 'standard' | 'poll' | 'course';
    poll?: {
        options: PollOption[];
        voters: { [userId: string]: number }; // Map from UID to option index
        totalVotes: number;
        endsAt: Timestamp;
    };
    courseData?: CourseData;
    likesCount: number;
    likedBy: string[];
    commentsCount: number;
    sharesCount: number;
    createdAt: any;
}

const courseSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  instructor: z.string().min(3, "El nombre del instructor es requerido."),
  url: z.string().url("Debe ser una URL válida."),
  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "El precio no puede ser negativo.").optional()
  ),
  isFree: z.boolean(),
  imageUrl: z.string().url("Debes subir una imagen para el curso.").nullable(),
}).refine(data => data.isFree || data.price !== undefined, {
  message: "Debes indicar un precio si el curso no es gratis.",
  path: ["price"],
});


const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: es });
}

const CoursePostCard = ({ post, onCommentClick }: { post: Post, onCommentClick: (post: Post) => void }) => {
    const course = post.courseData!;
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-0 relative">
                {course.imageUrl && (
                    <div className="aspect-video bg-muted">
                        <Image src={course.imageUrl} alt={course.title} layout="fill" className="object-cover" data-ai-hint="course promotion"/>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                     <CardTitle className="font-headline text-2xl text-white shadow-lg">{course.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground font-body">Instructor</p>
                        <p className="font-headline font-semibold">{course.instructor}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground font-body text-right">Precio</p>
                        <p className="font-headline font-bold text-lg text-primary">{course.isFree ? 'Gratis' : `Q${course.price?.toFixed(2)}`}</p>
                    </div>
                </div>
                <p className="font-body text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                 <Button asChild className="w-full font-headline mt-2">
                    <Link href={course.url} target="_blank" rel="noopener noreferrer">
                        Ir al Curso
                    </Link>
                </Button>
            </CardContent>
             <CardFooter className="flex items-center justify-between text-muted-foreground border-t pt-2 pb-2 px-6">
                <div className="flex items-center text-sm font-body">
                    Publicado por 
                    <Link href={`/perfil/${post.authorId}`} className="flex items-center gap-1.5 ml-1.5 group">
                        <Avatar className="h-5 w-5"><AvatarImage src={post.authorAvatar} /><AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback></Avatar>
                        <span className="group-hover:underline font-semibold">{post.authorName}</span>
                    </Link>
                </div>
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => onCommentClick(post)}>
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-body">{post.commentsCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                    </Button>
                 </div>
            </CardFooter>
        </Card>
    )
}

const PollComponent = ({ post, onVote }: { post: Post; onVote: (newPollData: Post['poll']) => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isVoting, setIsVoting] = useState(false);
    const [now, setNow] = useState(new Date());

    const hasPollEnded = post.poll?.endsAt ? now > post.poll.endsAt.toDate() : false;
    const userVoteIndex = user ? post.poll?.voters[user.uid] : undefined;
    const userHasVoted = userVoteIndex !== undefined;


    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleVote = async (optionIndex: number) => {
        if (!user || hasPollEnded || isVoting) return;

        console.log(`[handleVote] Iniciando voto para la opción ${optionIndex}. Usuario: ${user.uid}`);
        setIsVoting(true);
        const postRef = doc(clientDb, "forumPosts", post.id);

        try {
            let finalPollData: Post['poll'] | undefined;
            await runTransaction(clientDb, async (transaction) => {
                console.log("[handleVote] Dentro de la transacción de Firestore.");
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) {
                    console.error("[handleVote] Error: La publicación no existe.");
                    throw "Post does not exist!";
                }
                
                const postData = postDoc.data() as Post;
                const pollEndTime = postData.poll?.endsAt?.toDate();
                if (pollEndTime && new Date() > pollEndTime) {
                    console.log("[handleVote] La encuesta ha finalizado. No se puede votar.");
                    toast({ variant: "destructive", title: "Encuesta finalizada", description: "Esta encuesta ya ha terminado." });
                    return;
                }

                const newOptions = [...postData.poll!.options];
                const newVoters = { ...postData.poll!.voters };
                let newTotalVotes = postData.poll!.totalVotes;
                const previousVoteIndex = newVoters[user.uid];

                if (previousVoteIndex !== undefined) {
                    console.log(`[handleVote] El usuario ya había votado por la opción ${previousVoteIndex}. Cambiando voto.`);
                    if (previousVoteIndex === optionIndex) {
                        console.log("[handleVote] El usuario hizo clic en la misma opción de nuevo. No se hace nada.");
                        setIsVoting(false); // Release lock early
                        return;
                    }
                    newOptions[previousVoteIndex].votes -= 1;
                } else {
                    console.log("[handleVote] Voto nuevo. Incrementando el total de votos.");
                    newTotalVotes += 1;
                }
                
                newOptions[optionIndex].votes += 1;
                newVoters[user.uid] = optionIndex;
                
                finalPollData = {
                    ...postData.poll!,
                    options: newOptions,
                    voters: newVoters,
                    totalVotes: newTotalVotes
                };
                
                const updateData = { "poll": finalPollData };

                console.log("[handleVote] Datos a actualizar:", updateData);
                transaction.update(postRef, updateData);
            });
            console.log("[handleVote] Transacción completada exitosamente.");
            if (finalPollData) {
                onVote(finalPollData); // Trigger re-render on parent with the new poll data
            }
        } catch (error) {
            console.error("[handleVote] Error en la transacción de voto:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo registrar tu voto." });
        } finally {
            setIsVoting(false);
            console.log("[handleVote] Proceso de votación finalizado.");
        }
    };
    
    return (
        <div className="mt-3 space-y-2">
            {post.poll?.options.map((option, index) => {
                const percentage = post.poll!.totalVotes > 0 ? (option.votes / post.poll!.totalVotes) * 100 : 0;
                
                return (
                    <div key={index}>
                        {userHasVoted || hasPollEnded ? (
                            <div className="relative h-8 w-full rounded-md border bg-secondary overflow-hidden">
                                <div 
                                    className="absolute left-0 top-0 h-full bg-primary/30 transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                                {userVoteIndex === index && (
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-1 h-full bg-primary" />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
                                    <span className={cn("font-medium", userVoteIndex === index ? "text-primary" : "text-foreground")}>{option.text}</span>
                                    <span className="font-semibold text-muted-foreground">{percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        ) : (
                             <Button 
                                variant="outline" 
                                className="w-full justify-start"
                                onClick={() => handleVote(index)}
                                disabled={isVoting || !user}
                            >
                                {option.text}
                            </Button>
                        )}
                    </div>
                );
            })}
             <p className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
                <span>{post.poll?.totalVotes} votos</span>
                <span className="text-xl leading-none">·</span>
                 {hasPollEnded ? (
                    <span>Encuesta finalizada</span>
                 ) : post.poll?.endsAt ? (
                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> Finaliza {formatDistanceToNow(post.poll.endsAt.toDate(), { addSuffix: true, locale: es })}</span>
                 ) : null}
            </p>
        </div>
    )
}

const PostCard = ({ post, onCommentClick, onPostUpdate }: { post: Post, onCommentClick: (post: Post) => void, onPostUpdate: (postId: string, newPostData: Partial<Post>) => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLiking, setIsLiking] = useState(false);

    const hasLiked = user ? post.likedBy.includes(user.uid) : false;

    const handleLike = async () => {
        if (!user || isLiking) return;
        setIsLiking(true);

        const postRef = doc(clientDb, "forumPosts", post.id);

        try {
            if (hasLiked) {
                await updateDoc(postRef, {
                    likesCount: increment(-1),
                    likedBy: arrayRemove(user.uid)
                });
                 onPostUpdate(post.id, { 
                    likesCount: post.likesCount - 1, 
                    likedBy: post.likedBy.filter(uid => uid !== user.uid)
                });
            } else {
                await updateDoc(postRef, {
                    likesCount: increment(1),
                    likedBy: arrayUnion(user.uid)
                });
                 onPostUpdate(post.id, { 
                    likesCount: post.likesCount + 1, 
                    likedBy: [...post.likedBy, user.uid]
                });
            }
        } catch (error) {
            console.error("Error liking post:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la acción." });
        } finally {
            setIsLiking(false);
        }
    };
    
    const handleShare = () => {
        const url = `${window.location.origin}/foro/${post.id}`;
        navigator.clipboard.writeText(url)
            .then(() => toast({ title: "Enlace copiado", description: "El enlace a la publicación ha sido copiado." }))
            .catch(() => toast({ variant: "destructive", title: "Error", description: "No se pudo copiar el enlace." }));
    };

    if (post.type === 'course' && post.courseData) {
        return <CoursePostCard post={post} onCommentClick={onCommentClick}/>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Link href={`/perfil/${post.authorId}`}>
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={post.authorAvatar} alt={post.authorName} data-ai-hint="person portrait" />
                            <AvatarFallback>{post.authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <Link href={`/perfil/${post.authorId}`} className="font-headline font-semibold text-base group">
                                <span className="group-hover:underline">{post.authorName}</span>
                            </Link>
                            <p className="text-xs text-muted-foreground font-body">{formatDate(post.createdAt)}</p>
                        </div>
                         <div onClick={() => onCommentClick(post)} className="text-left w-full cursor-pointer">
                            {post.title && <CardTitle className="font-headline text-lg pt-1 hover:text-primary transition-colors">{post.title}</CardTitle>}
                         </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div onClick={() => onCommentClick(post)} className="text-left w-full cursor-pointer space-y-4">
                    <p className="font-body text-sm whitespace-pre-wrap">{post.content}</p>
                    {post.mediaUrl && (
                         <div className="relative aspect-video rounded-lg overflow-hidden border">
                            {post.mediaType === 'image' ? (
                                <Image src={post.mediaUrl} alt={`Imagen para la publicación`} layout="fill" className="object-cover" data-ai-hint="forum post image" />
                            ) : (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" controls />
                            )}
                        </div>
                    )}
                </div>
                {post.poll && <PollComponent post={post} onVote={(newPollData) => {
                    onPostUpdate(post.id, { poll: newPollData });
                }} />}
            </CardContent>
            <CardFooter className="flex items-center justify-between text-muted-foreground border-t pt-2 pb-2 px-6">
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike} disabled={!user || isLiking}>
                    <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'text-primary fill-primary/20' : ''}`} />
                    <span className="text-xs font-body">{post.likesCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => onCommentClick(post)}>
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs font-body">{post.commentsCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs font-body">{post.sharesCount > 0 ? post.sharesCount : ''}</span>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function ForumPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const courseImageInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState('24'); // In hours

  const [isPublishing, setIsPublishing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [activeTab, setActiveTab] = useState("recent");
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isUploadingCourseImage, setIsUploadingCourseImage] = useState(false);

  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      instructor: "",
      url: "",
      price: '',
      isFree: false,
      imageUrl: null,
    },
  });
  const isFreeWatcher = courseForm.watch('isFree');

  useEffect(() => {
    const fetchInitialPosts = async () => {
        setLoading(true);
        setPosts([]);
        setLastVisible(null);
        setHasMore(true);

        let q;
        if (activeTab === 'recent') {
            q = query(collection(clientDb, "forumPosts"), orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
        } else { // 'popular'
            q = query(collection(clientDb, "forumPosts"), orderBy("likesCount", "desc"), limit(POSTS_PER_PAGE));
        }

        try {
            const querySnapshot = await getDocs(q);
            const fetchedPosts: Post[] = [];
            querySnapshot.forEach((doc) => {
                fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
            });
            
            setPosts(fetchedPosts);
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc);
            
            if (querySnapshot.docs.length < POSTS_PER_PAGE) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Error fetching posts:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las publicaciones." });
        } finally {
            setLoading(false);
        }
    };
    
    fetchInitialPosts();

  }, [activeTab, toast]);

  const loadMorePosts = async () => {
    if (!lastVisible || loadingMore) return;
    setLoadingMore(true);

    let q;
    if (activeTab === 'recent') {
        q = query(collection(clientDb, "forumPosts"), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(POSTS_PER_PAGE));
    } else { // 'popular'
        q = query(collection(clientDb, "forumPosts"), orderBy("likesCount", "desc"), startAfter(lastVisible), limit(POSTS_PER_PAGE));
    }
    
    try {
        const querySnapshot = await getDocs(q);
        const newPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
            newPosts.push({ id: doc.id, ...doc.data() } as Post);
        });
        
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc);

        if (querySnapshot.docs.length < POSTS_PER_PAGE) {
            setHasMore(false);
        }
    } catch (error) {
        console.error("Error fetching more posts:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar más publicaciones." });
    } finally {
        setLoadingMore(false);
    }
  }


  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
    }
    const { url } = await response.json();
    return url;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setMediaFile(file);
        setMediaType(file.type.startsWith('image') ? 'image' : 'video');
        setMediaPreview(URL.createObjectURL(file));
        setShowPollCreator(false);
    }
  };
  
  const handlePollToggle = () => {
      setShowPollCreator(!showPollCreator);
      if(!showPollCreator) { // if turning on
          setMediaFile(null);
          setMediaPreview(null);
      }
  }

  const updatePollOption = (index: number, value: string) => {
      const newOptions = [...pollOptions];
      newOptions[index] = value;
      setPollOptions(newOptions);
  }
  const addPollOption = () => {
      if (pollOptions.length < 4) {
          setPollOptions([...pollOptions, '']);
      }
  }
  const removePollOption = (index: number) => {
      if (pollOptions.length > 2) {
          const newOptions = [...pollOptions];
          newOptions.splice(index, 1);
          setPollOptions(newOptions);
      }
  }

  const handleCreatePost = async () => {
    if ((!content.trim() && !mediaFile && !showPollCreator) || !user || !userProfile) return;

    setIsPublishing(true);
    let mediaUrl = null;
    let pollData = null;

    try {
        if (mediaFile) {
            mediaUrl = await uploadFile(mediaFile);
        }

        if (showPollCreator) {
            const validOptions = pollOptions.map(o => o.trim()).filter(o => o);
            if (validOptions.length < 2) {
                toast({ variant: "destructive", title: "Error en la encuesta", description: "La encuesta debe tener al menos 2 opciones."});
                setIsPublishing(false);
                return;
            }
            const now = new Date();
            const endsAt = new Date(now.getTime() + parseInt(pollDuration) * 60 * 60 * 1000);

            pollData = {
                options: validOptions.map(text => ({ text, votes: 0 })),
                voters: {},
                totalVotes: 0,
                endsAt: Timestamp.fromDate(endsAt),
            }
        }

        const newPostDoc = await addDoc(collection(clientDb, "forumPosts"), {
            authorId: user.uid,
            authorName: userProfile.name,
            authorAvatar: user.photoURL || '',
            type: showPollCreator ? 'poll' : 'standard',
            title: null,
            content: content,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            poll: pollData,
            likesCount: 0,
            likedBy: [],
            commentsCount: 0,
            sharesCount: 0,
            createdAt: serverTimestamp(),
        });

        // Add the new post to the top of the list if on "recent" tab
        if (activeTab === 'recent') {
            const newPostData = {
                id: newPostDoc.id,
                authorId: user.uid,
                authorName: userProfile.name,
                authorAvatar: user.photoURL || '',
                type: showPollCreator ? 'poll' : 'standard',
                title: null,
                content: content,
                mediaUrl: mediaUrl,
                mediaType: mediaType,
                poll: pollData,
                likesCount: 0,
                likedBy: [],
                commentsCount: 0,
                sharesCount: 0,
                createdAt: Timestamp.now(), // Use client-side timestamp for immediate display
            } as Post;
            setPosts(prev => [newPostData, ...prev]);
        }
        
        setContent("");
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        setShowPollCreator(false);
        setPollOptions(['', '']);
        setPollDuration('24');
        if (fileInputRef.current) fileInputRef.current.value = "";

        toast({ title: "¡Publicado!", description: "Tu aporte ahora es visible en el foro." });

    } catch (error) {
      console.error("Error creating post:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la publicación." });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCourseImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setIsUploadingCourseImage(true);
        try {
            const url = await uploadFile(file);
            courseForm.setValue('imageUrl', url);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo subir la imagen."});
        } finally {
            setIsUploadingCourseImage(false);
        }
    }
  }

  const handleCreateCourse = async (values: z.infer<typeof courseSchema>) => {
      if (!user || !userProfile) return;
      setIsPublishing(true);
      try {
          await addDoc(collection(clientDb, 'forumPosts'), {
            authorId: user.uid,
            authorName: userProfile.name,
            authorAvatar: user.photoURL || '',
            type: 'course',
            title: values.title,
            content: values.description,
            courseData: {
                title: values.title,
                description: values.description,
                instructor: values.instructor,
                price: values.isFree ? 0 : values.price,
                isFree: values.isFree,
                url: values.url,
                imageUrl: values.imageUrl,
            },
            likesCount: 0,
            likedBy: [],
            commentsCount: 0,
            sharesCount: 0,
            createdAt: serverTimestamp(),
          });
          toast({ title: '¡Curso publicado!', description: 'Tu curso ahora es visible para la comunidad.' });
          setIsCourseModalOpen(false);
          courseForm.reset();
      } catch (error) {
          console.error("Error creating course post:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo publicar el curso.'});
      } finally {
          setIsPublishing(false);
      }
  }

  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handlePostUpdate = (postId: string, newPostData: Partial<Post>) => {
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? { ...p, ...newPostData } : p
        )
      );
      // Also update the selected post in the modal if it's open
      if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, ...newPostData } : null);
      }
    };
  
  return (
    <>
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={user?.photoURL || undefined} alt={userProfile?.name || ''} data-ai-hint="person portrait" />
                        <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                    </Avatar>
                     <div className="w-full">
                        <Textarea 
                            placeholder="¿Qué estás pensando sobre acuicultura?"
                            className="bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={!user || isPublishing}
                        />
                         {mediaPreview && (
                            <div className="mt-2 relative w-fit">
                                {mediaType === 'image' ? (
                                    <Image src={mediaPreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />
                                ) : (
                                    <video src={mediaPreview} className="rounded-md w-48 h-auto" controls />
                                )}
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6"
                                    onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {showPollCreator && (
                            <div className="mt-4 space-y-3">
                                <div className="space-y-2">
                                    {pollOptions.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input 
                                                placeholder={`Opción ${index + 1}`}
                                                value={option}
                                                onChange={(e) => updatePollOption(index, e.target.value)}
                                                maxLength={80}
                                            />
                                            {pollOptions.length > 2 && (
                                                <Button variant="ghost" size="icon" onClick={() => removePollOption(index)}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    {pollOptions.length < 4 && (
                                        <Button variant="outline" size="sm" onClick={addPollOption}>
                                            <PlusCircle className="mr-2 h-4 w-4"/>Añadir opción
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Timer className="h-4 w-4 text-muted-foreground" />
                                        <Select value={pollDuration} onValueChange={setPollDuration}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Duración" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 hora</SelectItem>
                                                <SelectItem value="24">1 día</SelectItem>
                                                <SelectItem value="72">3 días</SelectItem>
                                                <SelectItem value="168">7 días</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" disabled={!user || isPublishing} onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground"/></Button>
                                <Button variant="ghost" size="icon" disabled={!user || isPublishing} onClick={() => fileInputRef.current?.click()}><Video className="h-5 w-5 text-muted-foreground"/></Button>
                                <Button variant="ghost" size="icon" disabled={!user || isPublishing} onClick={handlePollToggle} className={cn(showPollCreator && 'bg-primary/20 text-primary')}>
                                    <BarChartHorizontalBig className="h-5 w-5"/>
                                </Button>
                                 <Button variant="ghost" size="icon" disabled={!user || isPublishing} onClick={() => setIsCourseModalOpen(true)}>
                                    <GraduationCap className="h-5 w-5 text-muted-foreground"/>
                                </Button>
                            </div>
                            <Button className="font-headline" onClick={handleCreatePost} disabled={!user || isPublishing || (!content.trim() && !mediaFile && !showPollCreator)}>
                                {isPublishing ? 'Publicando...' : 'Publicar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
                <TabsTrigger value="recent" className="font-headline">Más Recientes</TabsTrigger>
                <TabsTrigger value="popular" className="font-headline">Más Populares</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                ) : posts.length > 0 ? (
                    posts.map((post) => <PostCard key={post.id} post={post} onCommentClick={handleCommentClick} onPostUpdate={handlePostUpdate} />)
                ) : (
                    <div className="text-center py-16">
                        <h3 className="font-headline text-xl">No hay publicaciones aquí</h3>
                        <p className="text-muted-foreground font-body mt-2">¡Sé el primero en compartir algo con la comunidad!</p>
                    </div>
                )}
                 {!loading && hasMore && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            onClick={loadMorePosts}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Cargando...' : 'Cargar más publicaciones'}
                        </Button>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    </div>

    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
            {selectedPost && (
                <>
                    <DialogHeader>
                        <DialogTitle className="font-headline truncate">
                            {selectedPost.title || `Publicación de ${selectedPost.authorName}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6">
                        <Card className="border-0 shadow-none">
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <Link href={`/perfil/${selectedPost.authorId}`}>
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={selectedPost.authorAvatar} alt={selectedPost.authorName} />
                                            <AvatarFallback>{selectedPost.authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1">
                                        <Link href={`/perfil/${selectedPost.authorId}`} className="font-headline font-semibold text-base group">
                                            <span className="group-hover:underline">{selectedPost.authorName}</span>
                                        </Link>
                                        <p className="text-xs text-muted-foreground font-body">{formatDate(selectedPost.createdAt)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="font-body text-sm mb-4 whitespace-pre-wrap">{selectedPost.content}</p>
                                {selectedPost.mediaUrl && (
                                     <div className="relative aspect-video rounded-lg overflow-hidden border">
                                        {selectedPost.mediaType === 'image' ? (
                                            <Image src={selectedPost.mediaUrl} alt={`Imagen para la publicación`} layout="fill" className="object-cover" />
                                        ) : (
                                             <video src={selectedPost.mediaUrl} className="w-full h-full object-cover" controls />
                                        )}
                                    </div>
                                )}
                                {selectedPost.poll && <PollComponent post={selectedPost} onVote={(newPollData) => {
                                    handlePostUpdate(selectedPost.id, { poll: newPollData });
                                }} />}
                            </CardContent>
                        </Card>
                        <div className="py-6">
                           <CommentSection 
                                postId={selectedPost.id} 
                                publicationAuthor={{id: selectedPost.authorId, name: selectedPost.authorName}} 
                            />
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
    </Dialog>

     <Dialog open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Publicar un Nuevo Curso</DialogTitle>
                <DialogDescription className="font-body">
                    Comparte un curso con la comunidad. Rellena los detalles para que sea fácil de encontrar.
                </DialogDescription>
            </DialogHeader>
            <Form {...courseForm}>
                <form onSubmit={courseForm.handleSubmit(handleCreateCourse)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <FormField control={courseForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Título del Curso</FormLabel><FormControl><Input placeholder="Ej: Fundamentos de Acuicultura Sostenible" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={courseForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Describe de qué trata el curso, a quién va dirigido, etc." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={courseForm.control} name="instructor" render={({ field }) => (
                            <FormItem><FormLabel>Instructor</FormLabel><FormControl><Input placeholder="Nombre del instructor o entidad" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={courseForm.control} name="url" render={({ field }) => (
                            <FormItem><FormLabel>URL del Curso</FormLabel><FormControl><Input placeholder="https://example.com/curso" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                         <FormField control={courseForm.control} name="price" render={({ field }) => (
                            <FormItem><FormLabel>Precio (Q)</FormLabel><FormControl><Input type="number" disabled={isFreeWatcher} placeholder="Ej: 250" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={courseForm.control} name="isFree" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 pb-2">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <Label className="font-normal">Marcar como Gratis</Label>
                            </FormItem>
                        )}/>
                    </div>
                    <FormField control={courseForm.control} name="imageUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Imagen del Curso</FormLabel>
                            <FormControl>
                                <div>
                                <Input type="file" className="hidden" ref={courseImageInputRef} onChange={handleCourseImageUpload} accept="image/*" />
                                <Button type="button" variant="outline" className="w-full" onClick={() => courseImageInputRef.current?.click()} disabled={isUploadingCourseImage}>
                                    {isUploadingCourseImage ? "Subiendo..." : "Subir Imagen Promocional"}
                                </Button>
                                {field.value && (
                                    <div className="mt-2 relative w-48 h-27">
                                        <Image src={field.value} alt="Vista previa del curso" layout="fill" className="rounded-md object-cover"/>
                                    </div>
                                )}
                                </div>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}/>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isPublishing}>{isPublishing ? "Publicando..." : "Publicar Curso"}</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
     </Dialog>
    </>
  );
}
