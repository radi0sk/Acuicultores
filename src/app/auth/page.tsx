
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

function FishIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 16.5C18.985 16.5 21 14.485 21 12C21 9.515 18.985 7.5 16.5 7.5H7.5C5.015 7.5 3 9.515 3 12C3 14.485 5.015 16.5 7.5 16.5H16.5Z" />
      <path d="M16.5 7.5C18.985 7.5 21 9.515 21 12" />
      <path d="M7.5 16.5 3 21" />
      <path d="M16.5 16.5 21 21" />
      <circle cx="8" cy="12" r="1" />
    </svg>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.658-3.546-11.147-8.318l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.424,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

export default function AuthPage() {
  const { isLoading, handleGoogleSignIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const onSignInClick = async () => {
    setIsSigningIn(true);
    try {
      await handleGoogleSignIn();
    } catch (error) {
      console.error("Sign in failed", error);
    } finally {
      setIsSigningIn(false);
    }
  }

  if (isLoading && !isSigningIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
              <FishIcon className="h-12 w-12 animate-pulse text-primary" />
              <p className="text-muted-foreground font-body">Verificando sesión...</p>
          </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <FishIcon className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl">AcuicultoresGT</CardTitle>
          </div>
          <CardDescription className="font-body">
            Bienvenido. Inicia sesión para continuar.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
            <Button variant="outline" className="w-full font-headline" onClick={onSignInClick} disabled={isSigningIn || isLoading}>
              {isSigningIn ? (
                'Iniciando sesión...'
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Continuar con Google
                </>
              )}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
