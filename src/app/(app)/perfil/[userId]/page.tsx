
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  Timestamp,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mail, MapPin, Package, BookOpen, Briefcase, GraduationCap, Award, FileText, Star, Edit, Eye, CalendarIcon, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { departments, municipalities } from '@/lib/guatemala-data';


// --- Interfaces de Datos ---
interface UserProfileData {
  id: string;
  name: string;
  email: string;
  roles: string[];
  photoURL: string;
  followersCount?: number;
  followingCount?: number;
}

interface ProfessionalProfileData {
    professionalPhotoURL?: string;
    professionalType?: string;
    specialization?: string;
    aboutMe?: string;
    experiences?: any[];
    academicEducation?: any[];
    certifications?: any[];
    isColegiado?: boolean;
    colegiadoNumber?: string;
    colegiadoStatus?: 'provided' | 'validated' | 'not_validated';
    location?: string;
    availability?: string[];
}

interface Product {
  id: string;
  title: string;
  price: number;
  location: string;
  image: string | null;
}

interface Publication {
    id: string;
    title: string;
    content: any; // Simplified for this context
    createdAt: Timestamp;
}

// --- Componentes de Sección ---

const ExperienceCard = ({ exp }: { exp: any }) => (
    <div className="relative pl-8">
        <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
        <div className="flex-1">
            <h4 className="font-headline font-semibold">{exp.role}</h4>
            <p className="text-sm text-muted-foreground font-body">{exp.company}</p>
            <p className="text-xs text-muted-foreground font-body">
                {exp.startMonth}/{exp.startYear} - {exp.isCurrent ? 'Actualidad' : `${exp.endMonth}/${exp.endYear}`}
            </p>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{exp.description}</p>
        </div>
    </div>
);

const EducationCard = ({ edu }: { edu: any }) => (
    <div className="relative pl-8">
         <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-secondary-foreground ring-2 ring-background" />
        <div className="flex-1">
            <h4 className="font-headline font-semibold">{edu.title}</h4>
            <p className="text-sm text-muted-foreground font-body">{edu.institution}, {edu.country}</p>
            <p className="text-xs text-muted-foreground font-body">{edu.endYear}</p>
        </div>
    </div>
);

const CertificationCard = ({ cert, onPreview }: { cert: any, onPreview: (url: string, title: string) => void }) => {
    const isPdf = cert.attachmentUrl?.toLowerCase().includes('.pdf');
    const thumbnailUrl = isPdf ? cert.attachmentUrl.replace(/\.pdf($|\?)/i, '.jpg') : cert.attachmentUrl;

    const handlePreviewClick = () => {
        const previewUrl = isPdf ? cert.attachmentUrl.replace(/\.pdf($|\?)/i, '.jpg') : cert.attachmentUrl;
        if (!previewUrl) return;
        onPreview(previewUrl, cert.name);
    }
    
    return (
        <div className="relative pl-8 flex items-start justify-between gap-4 group">
            <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-secondary-foreground ring-2 ring-background" />
            <div className="flex-1">
                <h4 className="font-headline font-semibold">{cert.name}</h4>
                <p className="text-sm text-muted-foreground font-body">{cert.entity}</p>
                <p className="text-xs text-muted-foreground font-body">Finalizado en {cert.endMonth}/{cert.endYear}</p>
            </div>
            {cert.attachmentUrl && (
                <div className="flex items-center gap-2">
                     <Image
                        src={thumbnailUrl}
                        alt={`Miniatura de ${cert.name}`}
                        width={40}
                        height={56}
                        className="w-10 h-14 object-cover rounded border bg-muted"
                        data-ai-hint="document preview"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8 transition-opacity opacity-0 group-hover:opacity-100" onClick={handlePreviewClick}>
                       <Eye className="h-4 w-4"/>
                    </Button>
                </div>
            )}
        </div>
    );
};


export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile: currentUserProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);


  // --- Modal de Vista Previa de Certificado ---
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // --- Modal de Solicitud de Servicio ---
  const [serviceRequestOpen, setServiceRequestOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // --- Campos del Formulario de Solicitud ---
  const [requestTitle, setRequestTitle] = useState('');
  const [requestType, setRequestType] = useState<'presupuesto' | 'asesoria' | 'otro'>('presupuesto');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestDeadline, setRequestDeadline] = useState<Date>();
  const [requestDepartment, setRequestDepartment] = useState('');
  const [requestMunicipality, setRequestMunicipality] = useState('');
  const [requestAddress, setRequestAddress] = useState('');
  
  const userId = params.userId as string;

  useEffect(() => {
    if (!userId) return;

    const fetchAllData = async () => {
        setLoading(true);
        const userDocRef = doc(clientDb, 'users', userId);
        const professionalProfileDocRef = doc(clientDb, `users/${userId}/professionalProfile/data`);
        
        try {
            const [userDocSnap, profProfileSnap] = await Promise.all([
                getDoc(userDocRef),
                getDoc(professionalProfileDocRef)
            ]);

            if (userDocSnap.exists()) {
                const profileData = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfileData;
                setProfile(profileData);

                 if (user) {
                    const currentUserDoc = await getDoc(doc(clientDb, 'users', user.uid));
                    if (currentUserDoc.exists()) {
                         const currentUserData = currentUserDoc.data();
                         setIsFollowing(currentUserData.following?.includes(userId) || false);
                    }
                }
            } else {
                toast({ variant: 'destructive', title: 'Usuario no encontrado' });
                router.push('/');
                return;
            }

            if (profProfileSnap.exists()) {
                setProfessionalProfile(profProfileSnap.data() as ProfessionalProfileData);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
            toast({ variant: 'destructive', title: 'Error al cargar el perfil' });
        }

        const productsQuery = query(collection(clientDb, 'products'), where('sellerId', '==', userId), limit(10));
        const publicationsQuery = query(collection(clientDb, 'publications'), where('authorId', '==', userId), where('status', '==', 'published'), limit(10));

        const unsubProducts = onSnapshot(productsQuery, snapshot => {
            const userProducts: Product[] = [];
            snapshot.forEach(doc => userProducts.push({ id: doc.id, ...doc.data() } as Product));
            setProducts(userProducts);
        });

        const unsubPublications = onSnapshot(publicationsQuery, snapshot => {
            const userPublications: Publication[] = [];
            snapshot.forEach(doc => userPublications.push({ id: doc.id, ...doc.data() } as Publication));
            setPublications(userPublications);
        });
        
        setLoading(false);

        return () => {
            unsubProducts();
            unsubPublications();
        };
    };

    fetchAllData();

  }, [userId, router, toast, user]);

  const handleFollowToggle = async () => {
    if (!user || !profile || isFollowProcessing) return;
    setIsFollowProcessing(true);

    const currentUserRef = doc(clientDb, 'users', user.uid);
    const targetUserRef = doc(clientDb, 'users', profile.id);

    const batch = writeBatch(clientDb);

    if (isFollowing) {
        // Unfollow
        batch.update(currentUserRef, {
            following: arrayRemove(profile.id),
            followingCount: increment(-1)
        });
        batch.update(targetUserRef, {
            followers: arrayRemove(user.uid),
            followersCount: increment(-1)
        });
    } else {
        // Follow
        batch.update(currentUserRef, {
            following: arrayUnion(profile.id),
            followingCount: increment(1)
        });
        batch.update(targetUserRef, {
            followers: arrayUnion(user.uid),
            followersCount: increment(1)
        });
    }

    try {
        await batch.commit();
        setIsFollowing(!isFollowing);
        // Manually update follower count on the profile being viewed
        setProfile(prev => {
            if (!prev) return null;
            const newFollowersCount = (prev.followersCount || 0) + (isFollowing ? -1 : 1);
            return { ...prev, followersCount: newFollowersCount };
        });

    } catch (error) {
        console.error("Error following/unfollowing user:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la acción.' });
    } finally {
        setIsFollowProcessing(false);
    }
  };


  const handleStartConversation = async () => {
      if (!user || !currentUserProfile || !profile || user.uid === profile.id) return;
      setIsSubmittingRequest(true);
      try {
          const conversationsRef = collection(clientDb, 'conversations');
          const q = query(conversationsRef, where('participantIds', '==', [user.uid, profile.id].sort()));
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
              // Conversation already exists, just redirect
              router.push('/mensajes');
              return;
          }

          // Create new conversation
          const newConvData = {
              participantIds: [user.uid, profile.id].sort(),
              participants: [
                  { userId: user.uid, name: currentUserProfile.name, photoUrl: user.photoURL || '' },
                  { userId: profile.id, name: profile.name, photoUrl: profile.photoURL || '' }
              ],
              lastMessage: null,
              lastUpdatedAt: serverTimestamp(),
              unreadCounts: { [user.uid]: 0, [profile.id]: 0 }
          };
          await addDoc(conversationsRef, newConvData);
          
          router.push('/mensajes');

      } catch (error) {
          console.error("Error starting conversation:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el chat.' });
      } finally {
          setIsSubmittingRequest(false);
      }
  }


  const handleServiceRequestSubmit = async () => {
    if (!user || !currentUserProfile || !profile || user.uid === profile.id || !requestTitle.trim() || !requestDescription.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor completa el título y la descripción de tu solicitud.' });
        return;
    }
    setIsSubmittingRequest(true);
    try {
        const conversationsRef = collection(clientDb, 'conversations');
        const q = query(
            conversationsRef,
            where('participantIds', '==', [user.uid, profile.id].sort())
        );
        
        const querySnapshot = await getDocs(q);
        let conversationId: string;

        if (!querySnapshot.empty) {
            conversationId = querySnapshot.docs[0].id;
        } else {
            const currentUserParticipant = { userId: user.uid, name: currentUserProfile.name, photoUrl: user.photoURL || '' };
            const otherUserParticipant = { userId: profile.id, name: profile.name, photoUrl: profile.photoURL || '' };

            const newConversationDoc = await addDoc(collection(clientDb, 'conversations'), {
                participantIds: [user.uid, profile.id].sort(),
                participants: [currentUserParticipant, otherUserParticipant],
                lastMessage: null,
                lastUpdatedAt: serverTimestamp(),
                unreadCounts: { [user.uid]: 0, [profile.id]: 0 }
            });
            conversationId = newConversationDoc.id;
        }

        const requestTypeName = requestType === 'presupuesto' ? 'Solicitud de Presupuesto' 
                              : requestType === 'asesoria' ? 'Solicitud de Asesoría' 
                              : 'Solicitud General';
        
        const formattedMessage = `**${requestTypeName}: ${requestTitle}**
*De: ${currentUserProfile.name}*

---

**Descripción del Proyecto:**
${requestDescription}

**Fecha Límite Deseada:** ${requestDeadline ? format(requestDeadline, 'PPP', { locale: es }) : 'No especificada'}
**Ubicación:** ${requestMunicipality}, ${requestDepartment}
**Dirección (opcional):** ${requestAddress || 'No especificada'}`;
        
        const messagesRef = collection(clientDb, 'conversations', conversationId, 'messages');
        await addDoc(messagesRef, {
            senderId: user.uid,
            text: formattedMessage,
            timestamp: serverTimestamp(),
        });
        
        const conversationRef = doc(clientDb, 'conversations', conversationId);
        await updateDoc(conversationRef, {
            lastMessage: {
                text: `📝 Solicitud: ${requestTitle}`,
                senderId: user.uid,
                timestamp: serverTimestamp(),
            },
            lastUpdatedAt: serverTimestamp(),
            [`unreadCounts.${profile.id}`]: increment(1)
        });

        toast({ title: "Solicitud Enviada", description: `Tu solicitud ha sido enviada a ${profile.name}.` });
        setServiceRequestOpen(false);
        setRequestTitle('');
        setRequestType('presupuesto');
        setRequestDescription('');
        setRequestDeadline(undefined);
        setRequestDepartment('');
        setRequestMunicipality('');
        setRequestAddress('');

        router.push('/mensajes');

    } catch (error) {
        console.error("Error sending service request:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud.' });
    } finally {
        setIsSubmittingRequest(false);
    }
  };

  const getColegiadoStatusText = () => {
      if (!professionalProfile?.isColegiado) return null;
      switch (professionalProfile.colegiadoStatus) {
          case 'validated':
              return 'Validado';
          case 'provided':
              return 'Proporcionado';
          case 'not_validated':
              return 'No Validado';
          default:
              return 'Proporcionado';
      }
  }

  const handlePreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewModalOpen(true);
  };


  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-8 space-y-8">
        <Skeleton className="h-10 w-24" />
        <div className="flex flex-col md:flex-row items-start gap-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!profile) {
    return <div>Usuario no encontrado</div>;
  }
  
  const isOwner = user?.uid === profile.id;
  const isProfessional = !!professionalProfile;
  const colegiadoStatusText = getColegiadoStatusText();

  return (
    <>
        <div className="container mx-auto max-w-5xl py-8">
        <Button asChild variant="outline" className="mb-6">
            <Link href="/mercado-profesionales"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Mercado</Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="h-28 w-28 border-4 border-background shadow-md flex-shrink-0">
                <AvatarImage src={professionalProfile?.professionalPhotoURL || profile.photoURL} alt={profile.name} data-ai-hint="person portrait" />
                <AvatarFallback className="text-4xl">{profile.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-headline font-bold">{profile.name}</h1>
                    {professionalProfile?.isColegiado && <Award className="h-6 w-6 text-yellow-500" title="Profesional Colegiado"/>}
                </div>
                <h2 className="text-xl font-body text-primary">{professionalProfile?.specialization}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <p><strong>{profile.followersCount || 0}</strong> Seguidores</p>
                    <p><strong>{profile.followingCount || 0}</strong> Siguiendo</p>
                </div>
                {professionalProfile?.location && (
                    <p className="flex items-center gap-2 text-muted-foreground font-body text-sm">
                    <MapPin className="h-4 w-4" /> {professionalProfile.location}
                    </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                    {professionalProfile?.availability?.map(avail => <Badge key={avail} variant="secondary">{avail}</Badge>)}
                </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 items-stretch">
                {isOwner ? (
                    <Button asChild><Link href="/mercado-profesionales/registro"><Edit className="mr-2 h-4 w-4"/> Editar mi Perfil</Link></Button>
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'} disabled={isFollowProcessing}>
                        {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Button>
                    
                    {isProfessional ? (
                        <Dialog open={serviceRequestOpen} onOpenChange={setServiceRequestOpen}>
                            <DialogTrigger asChild>
                            <Button><Mail className="mr-2 h-4 w-4" /> Solicitar Servicios</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="font-headline text-2xl">Formulario de Solicitud de Servicio</DialogTitle>
                                    <DialogDescription className="font-body">
                                    Completa este formulario para enviar una solicitud formal a {profile.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                                    <Card className="bg-secondary/50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="font-headline text-base">Tus Datos de Contacto</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm font-body text-muted-foreground">
                                            <p><strong>Nombre:</strong> {currentUserProfile?.name}</p>
                                            <p><strong>Correo:</strong> {currentUserProfile?.email}</p>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-2">
                                        <Label htmlFor="request-title" className="font-headline">Título de la Solicitud</Label>
                                        <Input id="request-title" placeholder="Ej: Cotización para sistema de aireación" value={requestTitle} onChange={e => setRequestTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-headline">Tipo de Solicitud</Label>
                                        <RadioGroup defaultValue="presupuesto" value={requestType} onValueChange={(v: any) => setRequestType(v)} className="flex gap-4 pt-1">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="presupuesto" id="r1" />
                                                <Label htmlFor="r1" className="font-body">Presupuesto</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="asesoria" id="r2" />
                                                <Label htmlFor="r2" className="font-body">Asesoría</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="otro" id="r3" />
                                                <Label htmlFor="r3" className="font-body">Otro</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="request-description" className="font-headline">Descripción Detallada</Label>
                                        <Textarea 
                                            id="request-description"
                                            placeholder="Describe detalladamente tu proyecto o problema. Incluye el tamaño, ubicación, metas y cualquier otro detalle relevante." 
                                            rows={6}
                                            value={requestDescription}
                                            onChange={e => setRequestDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                            <Label htmlFor="request-deadline" className="font-headline">Fecha Límite Deseada</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !requestDeadline && "text-muted-foreground"
                                                    )}
                                                    >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {requestDeadline ? format(requestDeadline, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                    mode="single"
                                                    selected={requestDeadline}
                                                    onSelect={setRequestDeadline}
                                                    initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-headline">Ubicación del Proyecto</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Select value={requestDepartment} onValueChange={val => { setRequestDepartment(val); setRequestMunicipality(''); }}>
                                                <SelectTrigger><SelectValue placeholder="Departamento"/></SelectTrigger>
                                                <SelectContent>
                                                    {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Select value={requestMunicipality} onValueChange={setRequestMunicipality} disabled={!requestDepartment}>
                                                <SelectTrigger><SelectValue placeholder="Municipio"/></SelectTrigger>
                                                <SelectContent>
                                                    {(municipalities[requestDepartment] || []).map(mun => <SelectItem key={mun} value={mun}>{mun}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="request-address" className="font-headline">Dirección (Opcional)</Label>
                                        <Input id="request-address" placeholder="Ej: Finca La Esmeralda, km 15" value={requestAddress} onChange={e => setRequestAddress(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancelar</Button>
                                    </DialogClose>
                                    <Button type="button" onClick={handleServiceRequestSubmit} disabled={isSubmittingRequest || !requestTitle || !requestDescription}>
                                        {isSubmittingRequest ? 'Enviando...' : 'Enviar Solicitud'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Button onClick={handleStartConversation} disabled={isSubmittingRequest}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar Mensaje
                        </Button>
                    )}
                  </div>
                ) : null}
            </div>
        </div>

        <Tabs defaultValue="profile" className="mt-12">
            <TabsList>
            <TabsTrigger value="profile" className="font-headline"><Briefcase className="mr-2 h-4 w-4"/>Perfil Profesional</TabsTrigger>
            <TabsTrigger value="products" className="font-headline"><Package className="mr-2 h-4 w-4"/>Productos ({products.length})</TabsTrigger>
            <TabsTrigger value="publications" className="font-headline"><BookOpen className="mr-2 h-4 w-4"/>Publicaciones ({publications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
                {!professionalProfile ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="font-body">Este usuario aún no ha completado su perfil profesional.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                        {professionalProfile.aboutMe && (
                            <Card>
                                <CardHeader><CardTitle className="font-headline text-lg">Sobre Mí</CardTitle></CardHeader>
                                <CardContent><p className="font-body text-muted-foreground">{professionalProfile.aboutMe}</p></CardContent>
                            </Card>
                        )}
                        {professionalProfile.experiences && professionalProfile.experiences.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><Briefcase/>Experiencia Profesional</CardTitle></CardHeader>
                                <CardContent className="space-y-6 border-l ml-6">
                                    {professionalProfile.experiences.map((exp: any, index: number) => <ExperienceCard key={index} exp={exp}/>)}
                                </CardContent>
                            </Card>
                        )}
                        </div>
                        <div className="lg:col-span-1 space-y-8 lg:sticky top-24">
                            {professionalProfile.academicEducation && professionalProfile.academicEducation.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><GraduationCap/>Educación</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 border-l ml-6">
                                        {professionalProfile.academicEducation.map((edu: any, index: number) => <EducationCard key={index} edu={edu}/>)}
                                    </CardContent>
                                </Card>
                            )}
                            {professionalProfile.certifications && professionalProfile.certifications.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><Award/>Certificaciones</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 border-l ml-6">
                                        {professionalProfile.certifications.map((cert: any, index: number) => <CertificationCard key={index} cert={cert} onPreview={handlePreview} />)}
                                    </CardContent>
                                </Card>
                            )}
                            {professionalProfile.isColegiado && colegiadoStatusText && (
                                <Card>
                                    <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><Star/>Credencial</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="font-semibold text-sm">Profesional Colegiado</p>
                                        <p className="text-sm text-muted-foreground">
                                            Estado: <span className={professionalProfile.colegiadoStatus === 'validated' ? 'text-green-600 font-medium' : ''}>{colegiadoStatusText}</span>
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length > 0 ? products.map(product => (
                <Card key={product.id} className="overflow-hidden">
                    <Link href={`/marketplace/${product.id}`}>
                        <div className="aspect-video bg-muted flex items-center justify-center hover:scale-105 transition-transform">
                            {product.image ? (
                            <img src={product.image} alt={product.title} className="object-cover w-full h-full"/>
                            ) : (
                            <Package className="h-16 w-16 text-muted-foreground" />
                            )}
                        </div>
                    </Link>
                    <CardContent className="p-4">
                    <CardTitle className="font-headline text-lg line-clamp-2">{product.title}</CardTitle>
                    <p className="font-body text-sm text-muted-foreground mt-1">{product.location}</p>
                    </CardContent>
                    <CardFooter className="bg-secondary/30 p-4">
                    <p className="font-headline font-semibold text-lg">Q{product.price.toFixed(2)}</p>
                    </CardFooter>
                </Card>
                )) : (
                <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground font-body">Este usuario no tiene productos a la venta.</p>
                </div>
                )}
            </div>
            </TabsContent>

            <TabsContent value="publications" className="mt-6">
                <div className="space-y-6">
                    {publications.length > 0 ? publications.map(post => (
                        <Card key={post.id}>
                            <CardHeader>
                                <Link href={`/publicaciones/${post.id}`}>
                                    <CardTitle className="font-headline text-xl hover:text-primary transition-colors">{post.title}</CardTitle>
                                </Link>
                                <CardDescription className="font-body text-sm text-muted-foreground">
                                    Publicado el {post.createdAt.toDate().toLocaleDateString('es-GT')}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button asChild variant="link" className="p-0 font-headline">
                                    <Link href={`/publicaciones/${post.id}`}>Leer más</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground font-body">Este usuario no ha hecho ninguna publicación.</p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
        </div>
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline">{previewTitle}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 h-full w-full bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                        <Image src={previewUrl} alt={`Vista previa de ${previewTitle}`} width={1200} height={1600} className="max-w-full max-h-full object-contain" />
                    ) : <p>Cargando vista previa...</p>}
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}
