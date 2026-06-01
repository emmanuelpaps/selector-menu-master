'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLANTS, PlantConfig } from '../config/plants';
import { motion, Variants } from 'framer-motion';
import { ShieldAlert, ArrowRight, Compass, ShieldCheck, Link } from 'lucide-react';
import Image from 'next/image';
import { seedMockData } from '../utils/mockSeeder';
import logo from '../assets/logo.png';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

export default function Home() {
    const router = useRouter();
    const [recentApprovals, setRecentApprovals] = useState<Record<string, boolean>>({});

    useEffect(() => {
        seedMockData();
        checkRecentApprovals();
    }, []);

    const checkRecentApprovals = async () => {
        try {
            const isMockMode = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id' || 
                               localStorage.getItem('ave_mock_logged_in') === 'true' ||
                               process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

            let approvalsList: any[] = [];

            if (isMockMode) {
                const mockData = localStorage.getItem('mock_approvals');
                if (mockData) {
                    approvalsList = JSON.parse(mockData);
                }
            } else {
                const approvalsRef = collection(db, 'approvals');
                const q = query(approvalsRef, orderBy('approvedAt', 'desc'), limit(20));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(docSnap => {
                    approvalsList.push(docSnap.data());
                });
            }

            const now = new Date().getTime();
            const threshold = 36 * 60 * 60 * 1000; // 36 hours
            const recentStatus: Record<string, boolean> = {};

            approvalsList.forEach(app => {
                if (app.plantId && app.approvedAt) {
                    const approvedTime = new Date(app.approvedAt).getTime();
                    if (now - approvedTime <= threshold) {
                        recentStatus[app.plantId] = true;
                    }
                }
            });

            setRecentApprovals(recentStatus);
        } catch (e) {
            console.error("Error checking recent approvals:", e);
        }
    };

    const handleCopyLink = (e: React.MouseEvent, plantId: string) => {
        e.stopPropagation();
        const host = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${host}/${plantId}`;
        
        navigator.clipboard.writeText(url).then(() => {
            toast.success('¡Enlace de selección copiado con éxito!');
        }).catch(err => {
            console.error('Error al copiar link:', err);
            toast.error('No se pudo copiar el enlace.');
        });
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
            {/* Background glowing blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-slate-900/40 blur-[130px] pointer-events-none" />

            {/* Header / Logo */}
            <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <img src={logo.src} alt="Grupo AVE" className="h-12 w-auto object-contain brightness-110 flex-shrink-0" />
                </div>
                <button
                    onClick={() => router.push('/admin')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center gap-2"
                >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Acceso Admin
                </button>
            </header>

            {/* Hero / Main Section */}
            <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 text-center flex-1 flex flex-col justify-center items-center gap-12 z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                >
                    <div className="mx-auto w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                        <Compass className="w-8 h-8 text-blue-500 animate-spin" style={{ animationDuration: '20s' }} />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider text-white leading-tight">
                        Ecosistema de <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                            Selección de Menú
                        </span>
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base font-medium leading-relaxed">
                        Selecciona tu planta industrial correspondiente para revisar, personalizar y aprobar el menú de tu maquila.
                    </p>
                </motion.div>

                {/* Plants Select Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-3xl"
                >
                    {Object.values(PLANTS).map((plant: PlantConfig) => {
                        const isRecentlyApproved = recentApprovals[plant.id];
                        
                        return (
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.03, y: -4 }}
                                key={plant.id}
                                onClick={() => router.push(`/${plant.id}`)}
                                className={cn(
                                    "bg-slate-900/50 backdrop-blur-md border rounded-3xl p-6 text-left flex flex-col justify-between group transition-all shadow-xl min-h-[185px] cursor-pointer relative overflow-hidden",
                                    isRecentlyApproved 
                                        ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:border-emerald-500/60" 
                                        : "border-slate-800 hover:border-blue-900/60"
                                )}
                            >
                                {isRecentlyApproved && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/50 text-[7px] font-black uppercase tracking-widest text-emerald-400 shadow-sm shadow-emerald-500/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Firmado hace poco</span>
                                    </div>
                                )}

                                <div>
                                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                                        {plant.location}
                                    </span>
                                    <h3 className="text-base font-bold text-white uppercase group-hover:text-blue-400 transition-colors">
                                        {plant.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                        {plant.companyName}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center mt-6 pt-3 border-t border-slate-900/60">
                                    <button
                                        onClick={(e) => handleCopyLink(e, plant.id)}
                                        className="p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-850 hover:border-blue-900/50 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-inner z-10"
                                        title="Copiar link de selección rápida"
                                    >
                                        <Link className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Copiar Link</span>
                                    </button>

                                    <span className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-blue-900/50 group-hover:bg-blue-600 transition-all">
                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 text-center text-slate-600 text-xs border-t border-slate-900/60 z-10">
                <p>© {new Date().getFullYear()} Grupo AVE. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
