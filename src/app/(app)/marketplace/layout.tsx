
"use client";

// Este layout ahora está simplificado. El layout principal de (app) se encarga de la estructura.
export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
        {children}
    </main>
  );
}
