
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { clientAuth, clientDb } from '@/lib/firebase/client';
import { useRouter, usePathname } from 'next/navigation';

interface UserProfile {
    name: string;
    roles: string[];
    email?: string;
    photoURL?: string;
    location?: string;
    createdAt?: any;
    followersCount?: number;
    followingCount?: number;
    followers?: string[];
    following?: string[];
}

// Expand this to include all fields from the professional profile form
interface ProfessionalProfile {
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
    [key: string]: any; // Allow other properties
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    professionalProfile: ProfessionalProfile | null;
    isLoading: boolean;
    activeProfile: string;
    setActiveProfile: (profile: string) => void;
    handleGoogleSignIn: () => Promise<void>;
    handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ['/mercado-profesionales', '/foro', '/biblioteca', '/marketplace', '/publicaciones'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeProfile, setActiveProfile] = useState('Productor');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(clientAuth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(clientDb, "users", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                let profileData: UserProfile;

                if (userDocSnap.exists()) {
                    profileData = userDocSnap.data() as UserProfile;
                } else {
                     profileData = {
                        name: firebaseUser.displayName || 'Nuevo Usuario',
                        email: firebaseUser.email || '',
                        photoURL: firebaseUser.photoURL || '',
                        roles: ['Productor'],
                        createdAt: serverTimestamp(),
                        followersCount: 0,
                        followingCount: 0,
                        followers: [],
                        following: [],
                    };
                    await setDoc(userDocRef, profileData);
                }
                
                setUser(firebaseUser);
                setUserProfile(profileData);
                setActiveProfile(profileData.roles?.[0] || 'Productor');
                
                const profProfileRef = doc(clientDb, `users/${firebaseUser.uid}/professionalProfile/data`);
                const profProfileSnap = await getDoc(profProfileRef);
                if (profProfileSnap.exists()) {
                    setProfessionalProfile(profProfileSnap.data() as ProfessionalProfile);
                } else {
                    setProfessionalProfile(null);
                }

                if (pathname === '/auth') {
                    router.push('/dashboard');
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setProfessionalProfile(null);
                if (!publicPaths.some(p => pathname.startsWith(p)) && pathname !== '/auth' && pathname !== '/') {
                   router.push('/auth');
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(clientAuth, provider);
            const firebaseUser = result.user;
            
            const docRef = doc(clientDb, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                const newProfile = {
                    name: firebaseUser.displayName || 'Nuevo Usuario',
                    email: firebaseUser.email || '',
                    photoURL: firebaseUser.photoURL || '',
                    roles: ['Productor'],
                    createdAt: serverTimestamp(),
                    followersCount: 0,
                    followingCount: 0,
                    followers: [],
                    following: [],
                };
                await setDoc(docRef, newProfile);
            }
            router.push('/dashboard');
        } catch (error) {
            console.error("Error during Google sign-in:", error);
        }
    };

    const handleLogout = async () => {
        await signOut(clientAuth);
        setUser(null);
        setUserProfile(null);
        setProfessionalProfile(null);
        router.push('/auth');
    };

    const value = { user, userProfile, professionalProfile, isLoading, activeProfile, setActiveProfile, handleGoogleSignIn, handleLogout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
