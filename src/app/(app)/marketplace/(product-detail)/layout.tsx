
"use client";

// Layout específico para la página de detalle de producto.
// No impone una estructura de columnas, permitiendo que la página de detalle controle su propio diseño.
export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
        {children}
    </section>
  );
}

