
"use client";

// Este layout ahora está simplificado. El layout principal de (app) se encarga de la estructura.
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
        {children}
    </div>
  );
}
