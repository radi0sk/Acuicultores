
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
    profileComplete?: boolean; // Flag to check if onboarding is done
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

const publicPaths = ['/mercado-profesionales', '/foro', '/biblioteca', '/marketplace', '/publicaciones', '/auth/completar-perfil'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeProfile, setActiveProfile] = useState('Productor');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(clientAuth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                
                // Set up real-time listener for user profile
                const userDocRef = doc(clientDb, "users", firebaseUser.uid);
                const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
                    let profileData: UserProfile;
                    if (docSnap.exists()) {
                        profileData = docSnap.data() as UserProfile;
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
                            profileComplete: false,
                        };
                        await setDoc(userDocRef, profileData);
                    }
                    setUserProfile(profileData);
                    if(profileData.roles && profileData.roles.length > 0) {
                        setActiveProfile(profileData.roles[0]);
                    }
                    if (!profileData.profileComplete) {
                        if (pathname !== '/auth/completar-perfil') {
                            router.push('/auth/completar-perfil');
                        }
                    } else if (pathname === '/auth' || pathname === '/auth/completar-perfil') {
                        router.push('/dashboard');
                    }
                });

                // Set up real-time listener for professional profile
                const profProfileRef = doc(clientDb, `users/${firebaseUser.uid}/professionalProfile/data`);
                const unsubProfProfile = onSnapshot(profProfileRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setProfessionalProfile(docSnap.data() as ProfessionalProfile);
                    } else {
                        setProfessionalProfile(null);
                    }
                });
                
                setIsLoading(false);
                
                // Return a cleanup function to unsubscribe from listeners on logout
                return () => {
                    unsubProfile();
                    unsubProfProfile();
                };

            } else {
                setUser(null);
                setUserProfile(null);
                setProfessionalProfile(null);
                if (!publicPaths.some(p => pathname.startsWith(p)) && pathname !== '/auth' && pathname !== '/') {
                   router.push('/auth');
                }
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(clientAuth, provider);
            // The onAuthStateChanged listener will handle the rest
        } catch (error) {
            console.error("Error during Google sign-in:", error);
        }
    };

    const handleLogout = async () => {
        await signOut(clientAuth);
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
