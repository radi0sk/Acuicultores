
// src/lib/firebase/client-config.ts
// IMPORTANT: Replace these placeholder values with your actual
// Firebase project's configuration object.
//
// You can find this in your Firebase console:
// Project Settings > General > Your apps > Web app > SDK setup and configuration > Config

export const firebaseConfig = {
    apiKey: "AIzaSyC8vX2PYurrmYIiJw6qRHYvQ8R1RfRLPz0",
    authDomain: "atitln-aquahub.firebaseapp.com",
    projectId: "atitln-aquahub",
    storageBucket: "atitln-aquahub.firebasestorage.app",
    messagingSenderId: "1012926555606",
    appId: "1:1012926555606:web:df6a8b4d172042422b7077",
};

// These are NOT secrets and are safe to be exposed in the client.
// NEXT_PUBLIC_ is required for them to be available in the browser and server components.
export const cloudinaryConfig = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
}
