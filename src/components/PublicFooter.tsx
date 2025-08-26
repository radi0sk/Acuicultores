import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground font-body">&copy; 2024 AcuicultoresGT. Todos los derechos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4 font-body">
                Términos de Servicio
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4 font-body">
                Privacidad
            </Link>
        </nav>
    </footer>
  );
}
