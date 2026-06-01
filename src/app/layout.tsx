import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
    title: 'Selector de Menú - Grupo AVE',
    description: 'Gestor y selector inteligente de menús para las plantas industriales de Grupo AVE',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased bg-slate-50 text-slate-900 font-sans">
                {children}
                <Toaster position="top-right" reverseOrder={false} />
            </body>
        </html>
    );
}
