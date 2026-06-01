/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Redirigir el build a un directorio temporal local para evitar bloqueos de sincronización de Google Drive
    distDir: '/tmp/ave-next-build-master',
};

export default nextConfig;
