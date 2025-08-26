
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase/client';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, UserCog, Briefcase, GraduationCap, MapPin, UploadCloud, FileText, PlusCircle, Trash2, Edit, Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { departments, municipalities, roles as predefinedRoles } from '@/lib/guatemala-data';


interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  activityType: string;
  department: string;
  municipality: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

interface AcademicItem {
  id: string;
  title: string;
  institution: string;
  country: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
}

interface CertificationItem {
  id: string;
  name: string;
  entity: string;
  endMonth: string;
  endYear: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'document';
}

const availabilityOptions = [
    { id: 'consultoria', label: 'Disponible para consultoría' },
    { id: 'proyectos', label: 'Disponible para proyectos' },
    { id: 'tiempo_completo', label: 'Buscando empleo a tiempo completo' },
    { id: 'no_disponible', label: 'No disponible actualmente' },
];


const MonthYearPicker = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
    const [month, year] = value ? value.split('-') : ['', ''];
    const currentYear = new Date().getFullYear();

    const handleMonthChange = (m: string) => onChange(`${m}-${year}`);
    const handleYearChange = (y: string) => onChange(`${month}-${y}`);

    return (
        <div className="flex gap-2">
            <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
                <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={(i + 1).toString().padStart(2, '0')}>
                            {new Date(0, i).toLocaleString('es', { month: 'long' })}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={year} onValueChange={handleYearChange} disabled={disabled}>
                <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 50 }, (_, i) => (
                        <SelectItem key={i} value={(currentYear - i).toString()}>
                            {(currentYear - i).toString()}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};


const CreatableCombobox = ({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder?: string }) => {
    const [open, setOpen] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleSelect = (currentValue: string) => {
        const newValue = currentValue === localValue ? '' : currentValue;
        setLocalValue(newValue);
        onChange(newValue);
        setOpen(false);
    };

    const handleCreate = () => {
        if (inputValue && !predefinedRoles.some(r => r.toLowerCase() === inputValue.toLowerCase())) {
            onChange(inputValue);
            setLocalValue(inputValue);
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {localValue || placeholder || "Seleccionar..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder="Buscar o crear rol..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                                Crear "{inputValue}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {predefinedRoles.map((role) => (
                                <CommandItem
                                    key={role}
                                    value={role}
                                    onSelect={handleSelect}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            localValue === role ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {role}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


export default function ProfessionalRegistrationPage() {
  const { user, userProfile, professionalProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [professionalType, setProfessionalType] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [academicEducation, setAcademicEducation] = useState<AcademicItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [isColegiado, setIsColegiado] = useState(false);
  const [colegiadoNumber, setColegiadoNumber] = useState('');

  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCertId, setUploadingCertId] = useState<string | null>(null);

  const hasProfessionalProfile = professionalProfile && Object.keys(professionalProfile).length > 0;

  useEffect(() => {
    if (!isAuthLoading) {
      if (professionalProfile) {
        setProfessionalType(professionalProfile.professionalType || '');
        setSpecialization(professionalProfile.specialization || '');
        setAboutMe(professionalProfile.aboutMe || '');
        setExperiences(professionalProfile.experiences || []);
        setAcademicEducation(professionalProfile.academicEducation || []);
        setCertifications(professionalProfile.certifications || []);
        setIsColegiado(professionalProfile.isColegiado || false);
        setColegiadoNumber(professionalProfile.colegiadoNumber || '');
        setAvailability(professionalProfile.availability || []);
        
        const [profMunicipality, profDepartment] = (professionalProfile.location || '').split(', ');
        if (profDepartment && departments.includes(profDepartment)) {
          setDepartment(profDepartment);
          if (profMunicipality && (municipalities[profDepartment] || []).includes(profMunicipality)) {
            setMunicipality(profMunicipality);
          }
        }
      }
      setIsLoadingProfile(false);
    }
  }, [professionalProfile, isAuthLoading]);

  // --- Sorting Logic ---
  const sortedExperiences = useMemo(() => {
    return [...experiences].sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;

        const dateA = a.endYear && a.endMonth ? new Date(parseInt(a.endYear), parseInt(a.endMonth) - 1) : new Date(0);
        const dateB = b.endYear && b.endMonth ? new Date(parseInt(b.endYear), parseInt(b.endMonth) - 1) : new Date(0);
        
        if (a.isCurrent || b.isCurrent) {
            const startDateA = new Date(parseInt(a.startYear), parseInt(a.startMonth) - 1);
            const startDateB = new Date(parseInt(b.startYear), parseInt(b.startMonth) - 1);
            return startDateB.getTime() - startDateA.getTime();
        }

        return dateB.getTime() - dateA.getTime();
    });
  }, [experiences]);

  const sortedEducation = useMemo(() => {
    return [...academicEducation].sort((a, b) => {
        const dateA = a.endYear && a.endMonth ? new Date(parseInt(a.endYear), parseInt(a.endMonth) - 1) : new Date(0);
        const dateB = b.endYear && b.endMonth ? new Date(parseInt(b.endYear), parseInt(b.endMonth) - 1) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [academicEducation]);
  
  const sortedCertifications = useMemo(() => {
     return [...certifications].sort((a, b) => {
        const dateA = a.endYear && a.endMonth ? new Date(parseInt(a.endYear), parseInt(a.endMonth) - 1) : new Date(0);
        const dateB = b.endYear && b.endMonth ? new Date(parseInt(b.endYear), parseInt(b.endMonth) - 1) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [certifications]);

  // --- Experience Handlers ---
  const addExperience = () => {
    setExperiences(prev => [...prev, {
        id: uuidv4(), role: '', company: '', activityType: '', department: '', municipality: '',
        startMonth: '', startYear: '', endMonth: '', endYear: '',
        isCurrent: false, description: ''
    }]);
  };
  const updateExperience = (id: string, field: keyof ExperienceItem, value: any) => {
      setExperiences(prev => prev.map(exp => {
        if (exp.id === id) {
            const updatedExp = { ...exp, [field]: value };
            // If department changes, reset municipality
            if (field === 'department') {
                updatedExp.municipality = '';
            }
            return updatedExp;
        }
        return exp;
    }));
  };
  const removeExperience = (id: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };

  // --- Education Handlers ---
  const addAcademicItem = () => {
    setAcademicEducation(prev => [...prev, {
        id: uuidv4(), title: '', institution: '', country: '',
        startMonth: '', startYear: '', endMonth: '', endYear: ''
    }]);
  };
  const updateAcademicItem = (id: string, field: keyof AcademicItem, value: any) => {
    setAcademicEducation(prev => prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };
  const removeAcademicItem = (id: string) => {
    setAcademicEducation(prev => prev.filter(edu => edu.id !== id));
  };

  // --- Certification Handlers ---
  const addCertification = () => {
    setCertifications(prev => [...prev, {
        id: uuidv4(), name: '', entity: '', endMonth: '', endYear: ''
    }]);
  };
  const updateCertification = (id: string, field: keyof CertificationItem, value: any) => {
    setCertifications(prev => prev.map(cert => cert.id === id ? { ...cert, [field]: value } : cert));
  };
  const removeCertification = (id: string) => {
    setCertifications(prev => prev.filter(cert => cert.id !== id));
  };
    
    const handleCertificationUpload = async (file: File, certId: string) => {
        if (!file) return;
        setUploadingCertId(certId);

        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to parse error JSON from server.' }));
                throw new Error(errorData.error || 'Failed to upload file');
            }

            const { url, type } = await response.json();

            updateCertification(certId, 'attachmentUrl', url);
            updateCertification(certId, 'attachmentName', file.name);
            updateCertification(certId, 'attachmentType', type === 'image' ? 'image' : 'document');
            
            toast({ title: 'Archivo subido', description: 'Se ha adjuntado a la certificación.' });

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error al subir', description: error.message });
        } finally {
             setUploadingCertId(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, certId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            handleCertificationUpload(file, certId);
        }
    };
    
    const removeCertificationAttachment = (certId: string) => {
        updateCertification(certId, 'attachmentUrl', undefined);
        updateCertification(certId, 'attachmentName', undefined);
        updateCertification(certId, 'attachmentType', undefined);
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !professionalType || !specialization || !department || !municipality || availability.length === 0) {
      toast({ variant: 'destructive', title: 'Campos requeridos', description: 'Por favor completa todos los campos marcados con *.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const professionalProfileData: Partial<ProfessionalProfile> = {
        professionalType,
        specialization,
        aboutMe,
        experiences: sortedExperiences,
        isColegiado,
        colegiadoNumber,
        academicEducation: sortedEducation,
        certifications: sortedCertifications,
        location: `${municipality}, ${department}`,
        availability,
        updatedAt: serverTimestamp(),
        isProfessional: true,
      };

      if (isColegiado && !professionalProfile?.colegiadoStatus) {
        professionalProfileData.colegiadoStatus = 'provided';
      }

      const profileRef = doc(clientDb, `users/${user.uid}/professionalProfile/data`);
      
      await setDoc(profileRef, professionalProfileData, { merge: true });

      toast({ title: '¡Perfil guardado!', description: 'Tu perfil profesional ha sido guardado exitosamente.' });
      router.push(`/perfil/${user.uid}`);

    } catch (error) {
      console.error("Error saving professional profile:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar tu perfil. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilityChange = (checked: boolean, optionId: string) => {
    setAvailability(prev => {
        if (checked) {
            return [...prev, optionId];
        } else {
            return prev.filter(item => item !== optionId);
        }
    });
  };

  if (isAuthLoading || isLoadingProfile) {
      return (
          <div className="max-w-4xl mx-auto space-y-8 py-8">
              <Skeleton className="h-12 w-1/2"/>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
      )
  }

  if (!user) {
      return (
          <div className="text-center py-16">
            <h2 className="font-headline text-2xl">Acceso Denegado</h2>
            <p className="text-muted-foreground font-body mt-2">Debes iniciar sesión para registrarte como profesional.</p>
            <Button asChild className="mt-4"><Link href="/auth">Iniciar Sesión</Link></Button>
          </div>
      )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          {hasProfessionalProfile ? 'Editar Perfil Profesional' : 'Registro de Profesional'}
        </h1>
        <p className="text-muted-foreground font-body">Completa tu perfil para que otros puedan conocer tu trabajo y contactarte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><UserCog /> Información Básica</CardTitle>
          <CardDescription>Esta es tu tarjeta de presentación. Asegúrate de que sea clara y profesional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || undefined} alt={userProfile?.name || ''} />
              <AvatarFallback>{userProfile?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" value={userProfile?.name || ''} disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="type" className="font-headline">Tipo de Profesional *</Label>
                <Select value={professionalType} onValueChange={setProfessionalType}>
                  <SelectTrigger id="type"><SelectValue placeholder="Selecciona una opción" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Titulado">Profesional Titulado</SelectItem>
                    <SelectItem value="Empírico">Profesional Empírico</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization" className="font-headline">Especialización Principal *</Label>
              <Input id="specialization" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Ej: Piscicultura, Camaronicultura" />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="aboutMe" className="font-headline">Sobre mí / Biografía</Label>
              <Textarea id="aboutMe" value={aboutMe} onChange={e => setAboutMe(e.target.value)} placeholder="Describe brevemente tu experiencia, enfoque y filosofía de trabajo." rows={4}/>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline flex items-center gap-2"><Briefcase /> Experiencia Profesional</CardTitle>
                    <CardDescription>Detalla tus roles y responsabilidades. Se ordenará de más reciente a más antiguo.</CardDescription>
                </div>
                <Button type="button" onClick={addExperience}><PlusCircle className="mr-2 h-4 w-4"/>Añadir</Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {sortedExperiences.length > 0 ? sortedExperiences.map((exp) => (
                <Card key={exp.id} className="p-4 relative bg-secondary/50">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeExperience(exp.id)}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`role-${exp.id}`}>Puesto / Rol</Label>
                             <CreatableCombobox 
                                value={exp.role} 
                                onChange={(val) => updateExperience(exp.id, 'role', val)}
                                placeholder="Selecciona o escribe un rol"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`company-${exp.id}`}>Empresa / Proyecto</Label>
                            <Input id={`company-${exp.id}`} value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} placeholder="Acuícola del Pacífico S.A." />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor={`activityType-${exp.id}`}>Tipo de Actividad</Label>
                            <Select value={exp.activityType} onValueChange={(val) => updateExperience(exp.id, 'activityType', val)}>
                                <SelectTrigger id={`activityType-${exp.id}`}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Comercial">Comercial</SelectItem>
                                    <SelectItem value="Académica">Académica</SelectItem>
                                    <SelectItem value="Consultoría">Consultoría</SelectItem>
                                    <SelectItem value="Personal / Hobby">Personal / Hobby</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor={`department-exp-${exp.id}`}>Departamento</Label>
                                <Select value={exp.department} onValueChange={(val) => updateExperience(exp.id, 'department', val)}>
                                    <SelectTrigger id={`department-exp-${exp.id}`}>
                                        <SelectValue placeholder="Depto."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor={`municipality-exp-${exp.id}`}>Municipio</Label>
                                <Select value={exp.municipality} onValueChange={(val) => updateExperience(exp.id, 'municipality', val)} disabled={!exp.department}>
                                    <SelectTrigger id={`municipality-exp-${exp.id}`}>
                                        <SelectValue placeholder="Muni."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(municipalities[exp.department] || []).map(mun => <SelectItem key={mun} value={mun}>{mun}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label>Fecha de Inicio</Label>
                            <MonthYearPicker value={`${exp.startMonth}-${exp.startYear}`} onChange={(val) => {
                                const [m, y] = val.split('-');
                                updateExperience(exp.id, 'startMonth', m || '');
                                updateExperience(exp.id, 'startYear', y || '');
                            }} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha de Fin</Label>
                            <MonthYearPicker value={`${exp.endMonth}-${exp.endYear}`} onChange={(val) => {
                                const [m, y] = val.split('-');
                                updateExperience(exp.id, 'endMonth', m || '');
                                updateExperience(exp.id, 'endYear', y || '');
                            }} disabled={exp.isCurrent} />
                             <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id={`current-${exp.id}`} checked={exp.isCurrent} onCheckedChange={(checked) => updateExperience(exp.id, 'isCurrent', !!checked)} />
                                <label htmlFor={`current-${exp.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Actualidad
                                </label>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2 mt-4">
                        <Label htmlFor={`description-${exp.id}`}>Logros y Responsabilidades</Label>
                        <Textarea id={`description-${exp.id}`} value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} placeholder="Describe tus responsabilidades y logros. Usa viñetas para mayor claridad." />
                    </div>
                </Card>
            )) : <p className="text-sm text-muted-foreground text-center py-4">Aún no has añadido ninguna experiencia laboral.</p>}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><GraduationCap /> Educación y Credenciales</CardTitle>
            <CardDescription>Detalla tus títulos académicos y cursos, adjuntando evidencia si es posible. El sistema organizará tu historial de forma cronológica.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                    <Checkbox id="isColegiado" checked={isColegiado} onCheckedChange={(checked) => setIsColegiado(!!checked)}/>
                    <Label htmlFor="isColegiado" className="font-headline text-base">Soy un Profesional Colegiado</Label>
                </div>
                {isColegiado && (
                    <div className="space-y-2 pl-6">
                        <Label htmlFor="colegiadoNumber">Número de Colegiado</Label>
                        <Input id="colegiadoNumber" value={colegiadoNumber} onChange={(e) => setColegiadoNumber(e.target.value)} placeholder="Ej: 12345" />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-headline font-semibold">Educación Académica</h3>
                    <Button type="button" size="sm" variant="outline" onClick={addAcademicItem}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Título</Button>
                </div>
                {sortedEducation.length > 0 ? sortedEducation.map(edu => (
                     <Card key={edu.id} className="p-4 relative bg-secondary/50">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeAcademicItem(edu.id)}><Trash2 className="h-4 w-4"/></Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Título Obtenido</Label><Input value={edu.title} onChange={e => updateAcademicItem(edu.id, 'title', e.target.value)} placeholder="Licenciatura en Biología Marina"/></div>
                            <div className="space-y-2"><Label>Institución</Label><Input value={edu.institution} onChange={e => updateAcademicItem(edu.id, 'institution', e.target.value)} placeholder="Universidad de San Carlos"/></div>
                            <div className="space-y-2"><Label>País</Label><Input value={edu.country} onChange={e => updateAcademicItem(edu.id, 'country', e.target.value)} placeholder="Guatemala"/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2"><Label>Fecha de Inicio</Label><MonthYearPicker value={`${edu.startMonth}-${edu.startYear}`} onChange={v => { const [m, y] = v.split('-'); updateAcademicItem(edu.id, 'startMonth', m || ''); updateAcademicItem(edu.id, 'startYear', y || ''); }}/></div>
                            <div className="space-y-2"><Label>Fecha de Fin</Label><MonthYearPicker value={`${edu.endMonth}-${edu.endYear}`} onChange={v => { const [m, y] = v.split('-'); updateAcademicItem(edu.id, 'endMonth', m || ''); updateAcademicItem(edu.id, 'endYear', y || ''); }}/></div>
                        </div>
                    </Card>
                )) : <p className="text-sm text-muted-foreground text-center py-2">Aún no has añadido formación académica.</p>}
            </div>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-headline font-semibold">Cursos, Certificaciones y Logros</h3>
                    <Button type="button" size="sm" variant="outline" onClick={addCertification}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Entrada</Button>
                </div>
                 {sortedCertifications.length > 0 ? sortedCertifications.map(cert => (
                    <Card key={cert.id} className="p-4 relative bg-secondary/50">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeCertification(cert.id)}><Trash2 className="h-4 w-4"/></Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Nombre del Curso/Certificación</Label><Input value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} placeholder="Certificado en Sistemas RAS"/></div>
                            <div className="space-y-2"><Label>Entidad Emisora</Label><Input value={cert.entity} onChange={e => updateCertification(cert.id, 'entity', e.target.value)} placeholder="Aquaculture Training Center"/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                             <div className="space-y-2"><Label>Fecha de Finalización</Label><MonthYearPicker value={`${cert.endMonth}-${cert.endYear}`} onChange={v => { const [m, y] = v.split('-'); updateCertification(cert.id, 'endMonth', m || ''); updateCertification(cert.id, 'endYear', y || ''); }}/></div>
                        </div>
                         <div className="space-y-2 mt-4">
                            <Label>Archivo Adjunto (Opcional)</Label>
                            {!cert.attachmentUrl ? (
                                <>
                                    <input
                                        type="file"
                                        id={`cert-upload-${cert.id}`}
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, cert.id)}
                                        accept="image/*,application/pdf"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={uploadingCertId === cert.id}
                                        onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()}
                                    >
                                        <UploadCloud className="mr-2 h-4 w-4"/>
                                        {uploadingCertId === cert.id ? 'Subiendo...' : 'Subir Imagen o PDF'}
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center justify-between p-2 border rounded-md bg-background">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
                                        <span className="truncate text-sm font-medium">{cert.attachmentName || 'Archivo adjunto'}</span>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeCertificationAttachment(cert.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                )) : <p className="text-sm text-muted-foreground text-center py-2">Aún no has añadido cursos, certificaciones o logros.</p>}
            </div>

        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><MapPin /> Ubicación y Disponibilidad</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="font-headline">Ubicación Principal *</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Select value={department} onValueChange={val => { setDepartment(val); setMunicipality(''); }}>
                        <SelectTrigger><SelectValue placeholder="Departamento"/></SelectTrigger>
                        <SelectContent>
                            {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={municipality} onValueChange={setMunicipality} disabled={!department}>
                        <SelectTrigger><SelectValue placeholder="Municipio"/></SelectTrigger>
                        <SelectContent>
                            {(municipalities[department] || []).map(mun => <SelectItem key={mun} value={mun}>{mun}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label className="font-headline">Disponibilidad *</Label>
                <div className="space-y-2 pt-2">
                    {availabilityOptions.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`availability-${option.id}`} 
                                checked={availability.includes(option.id)}
                                onCheckedChange={(checked) => handleAvailabilityChange(!!checked, option.id)}
                            />
                            <Label htmlFor={`availability-${option.id}`} className="font-normal">
                                {option.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Guardando Perfil...' : 'Guardar Perfil Profesional'}
        </Button>
      </div>
    </form>
  );
}
