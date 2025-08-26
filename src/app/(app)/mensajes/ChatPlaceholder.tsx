
import { MessagesSquare } from "lucide-react";

export default function ChatPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-secondary/20 text-center p-8 border-l">
            <div className="p-6 rounded-full bg-background mb-4 border shadow-sm">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                >
                    <path d="M17 14h.01" />
                    <path d="M12.5 18.5A5.5 5.5 0 0 1 7 13V7a5.5 5.5 0 0 1 11 0v1" />
                    <path d="M11 18.5a5.5 5.5 0 0 1-5.5-5.5" />
                    <path d="M12 7a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" />
                    <path d="m7 13-.87.87a2.12 2.12 0 0 0 0 3L7 17.74" />
                    <path d="m11 18.5 1 .5" />
                </svg>
            </div>
            <h2 className="text-2xl font-headline text-slate-700">Mensajería de Atitlán AquaHub</h2>
            <p className="max-w-sm mt-2 font-body text-muted-foreground">
                Envía y recibe mensajes directamente con otros miembros de la comunidad. Selecciona una conversación para empezar.
            </p>
        </div>
    )
}
