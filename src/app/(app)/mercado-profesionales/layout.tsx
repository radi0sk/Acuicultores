
"use client";

import ProfessionalsNav from "./ProfessionalsNav";

export default function MercadoProfesionalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
        <aside className="hidden md:flex flex-col gap-4 sticky top-20">
            <ProfessionalsNav />
        </aside>
        <main>
            {children}
        </main>
    </div>
  );
}
