// app/(landing)/layout.tsx
// Layout simple para la landing page (sin sidebar ni navegación del dashboard)

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
