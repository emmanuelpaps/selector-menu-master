'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, getDocs, setDoc, doc, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { PLANTS, PlantConfig } from '../../config/plants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LogOut, 
    Bell, 
    ArrowRight, 
    FileSpreadsheet, 
    User, 
    Briefcase, 
    Calendar,
    Settings,
    Activity,
    CheckCircle2,
    Shield,
    Loader2,
    Link,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { CATEGORY_LABELS } from '../../data/menu';
import { detectProtein } from '../../utils/spellcheck';
import Image from 'next/image';
import logo from '../../assets/logo.png';

interface ChangeItem {
    day: string;
    category: string;
    original: string;
    selected: string;
}

interface ApprovalAlert {
    id: string;
    plantId: string;
    plantName: string;
    weekStartDate: string;
    approvedAt: string;
    approvedBy: string;
    role: string;
    modifiedDishesCount: number;
    changeLog?: ChangeItem[];
    selectedMenu?: any;
}

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [approvals, setApprovals] = useState<ApprovalAlert[]>([]);
    const [plantsEmpty, setPlantsEmpty] = useState(false);
    const [expandedApprovalId, setExpandedApprovalId] = useState<string | null>(null);
    const [publishedMenus, setPublishedMenus] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const router = useRouter();

    const isMockMode = useMemo(() => {
        return typeof window !== 'undefined' && (
            localStorage.getItem('ave_mock_logged_in') === 'true' ||
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id' ||
            process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
        );
    }, []);

    const toggleExpandApproval = (id: string) => {
        setExpandedApprovalId(prev => prev === id ? null : id);
    };

    // Timer global para actualizar la cuenta regresiva en caliente
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Cargar menús publicados activos
    useEffect(() => {
        if (!user) return;

        if (isMockMode) {
            const loadMockPublishedMenus = () => {
                const list: any[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('mock_menu_')) {
                        try {
                            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                            if (parsed.status === 'published') {
                                list.push(parsed);
                            }
                        } catch (e) {}
                    }
                }
                setPublishedMenus(list);
            };

            loadMockPublishedMenus();
            const interval = setInterval(loadMockPublishedMenus, 2000);
            return () => clearInterval(interval);
        } else {
            const menusRef = collection(db, 'menus');
            const q = query(menusRef, where('status', '==', 'published'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const menusData: any[] = [];
                snapshot.forEach((doc) => {
                    menusData.push({ id: doc.id, ...doc.data() });
                });
                setPublishedMenus(menusData);
            }, (error) => {
                console.error('Error al escuchar menús publicados:', error);
            });
            return () => unsubscribe();
        }
    }, [user, isMockMode]);

    const getPlantCountdown = (plantId: string) => {
        const plantMenus = publishedMenus.filter(m => m.plantId === plantId && m.expirationDate);
        if (plantMenus.length === 0) return null;

        const now = currentTime;
        const activeMenus = plantMenus.filter(m => {
            const expTime = new Date(m.expirationDate).getTime();
            return expTime > now;
        });

        if (activeMenus.length === 0) {
            return {
                text: 'Plazo expirado / Cerrado',
                isUrgent: false,
                hasActiveMenu: false
            };
        }

        activeMenus.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        const targetMenu = activeMenus[0];
        const targetTime = new Date(targetMenu.expirationDate).getTime();
        const diff = targetTime - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const isLessDay = diff < 24 * 60 * 60 * 1000;

        let text = '';
        if (days > 0) text += `${days}d `;
        text += `${hours}h ${minutes}m ${seconds}s`;

        return {
            text,
            isUrgent: isLessDay,
            hasActiveMenu: true,
            weekStartDate: targetMenu.weekStartDate
        };
    };

    useEffect(() => {
        if (localStorage.getItem('ave_mock_logged_in') === 'true') {
            const userName = localStorage.getItem('ave_admin_name') || 'Administrador';
            setUser({ email: userName, uid: 'mock-admin-uid' });
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/admin/login');
            } else {
                setUser(currentUser);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Verificar si la base de datos de plantas está vacía
    useEffect(() => {
        if (!user) return;
        const checkPlants = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'plants'));
                if (querySnapshot.empty) {
                    setPlantsEmpty(true);
                }
            } catch (err) {
                console.error("Error al verificar plantas:", err);
            }
        };
        checkPlants();
    }, [user]);

    const handleInitializePlants = async () => {
        setLoading(true);
        try {
            for (const [id, config] of Object.entries(PLANTS)) {
                await setDoc(doc(db, 'plants', id), {
                    ...config,
                    masterPassword: 'AVE2026' // Contraseña maestra inicial
                });
            }
            setPlantsEmpty(false);
            toast.success('Plantas inicializadas en Firestore con éxito');
        } catch (err) {
            console.error("Error al sembrar plantas:", err);
            toast.error('No se pudieron inicializar las plantas');
        } finally {
            setLoading(false);
        }
    };

    // Escuchar alertas de aprobaciones en tiempo real o mock_approvals en desarrollo
    useEffect(() => {
        if (!user) return;

        if (isMockMode) {
            const loadMockApprovals = () => {
                try {
                    const mockData = localStorage.getItem('mock_approvals');
                    if (mockData) {
                        const parsed = JSON.parse(mockData) as ApprovalAlert[];
                        setApprovals(parsed);
                    } else {
                        setApprovals([]);
                    }
                } catch (e) {
                    console.error("Error cargando mock_approvals:", e);
                }
            };

            loadMockApprovals();

            // Escuchar cambios locales en localStorage
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'mock_approvals') {
                    loadMockApprovals();
                }
            };

            // También un intervalo corto por si se modifica en la misma pestaña
            const interval = setInterval(loadMockApprovals, 2000);

            window.addEventListener('storage', handleStorageChange);
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                clearInterval(interval);
            };
        } else {
            const approvalsRef = collection(db, 'approvals');
            const q = query(approvalsRef, orderBy('approvedAt', 'desc'), limit(20));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const approvalsData: ApprovalAlert[] = [];
                snapshot.forEach((doc) => {
                    approvalsData.push({ id: doc.id, ...doc.data() } as ApprovalAlert);
                });
                setApprovals(approvalsData);
            }, (error) => {
                console.error('Error al escuchar aprobaciones:', error);
            });

            return () => unsubscribe();
        }
    }, [user, isMockMode]);

    const handleLogout = async () => {
        try {
            localStorage.removeItem('ave_mock_logged_in');
            await signOut(auth);
            toast.success('Sesión cerrada con éxito');
            router.push('/admin/login');
        } catch (error) {
            toast.error('Error al cerrar sesión');
        }
    };

    const formatDate = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('es-MX', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch {
            return isoString;
        }
    };

    const handleCopyLink = (plantId: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/${plantId}`;
        navigator.clipboard.writeText(url)
            .then(() => {
                toast.success('¡Enlace de selección copiado al portapapeles!');
            })
            .catch(() => {
                toast.error('Error al copiar el enlace');
            });
    };

    const analytics = useMemo(() => {
        if (approvals.length === 0) {
            return {
                proteinDistribution: { pollo: 0, res: 0, cerdo: 0, pescado: 0 },
                customizationIndex: 0,
                totalDishes: 0,
                modifiedDishes: 0,
                totalApprovals: 0
            };
        }

        let polloCount = 0;
        let resCount = 0;
        let cerdoCount = 0;
        let pescadoCount = 0;
        let totalProteins = 0;

        let totalDishes = 0;
        let totalModifiedDishes = 0;

        approvals.forEach(approval => {
            totalModifiedDishes += approval.modifiedDishesCount || 0;
            
            if (approval.selectedMenu) {
                approval.selectedMenu.forEach((day: any) => {
                    if (day.dishes) {
                        day.dishes.forEach((dish: any) => {
                            totalDishes++;
                            const protein = detectProtein(dish.name);
                            if (protein === 'pollo') { polloCount++; totalProteins++; }
                            else if (protein === 'res') { resCount++; totalProteins++; }
                            else if (protein === 'puerco') { cerdoCount++; totalProteins++; }
                            else if (protein === 'marisco') { pescadoCount++; totalProteins++; }
                        });
                    }
                });
            } else {
                if (approval.changeLog) {
                    totalDishes += 25; // Supuesto de 25 platillos por menú promedio si no está el menu completo
                }
            }
        });

        const proteinPct = (count: number) => {
            return totalProteins > 0 ? Math.round((count / totalProteins) * 100) : 0;
        };

        const customizationIndex = totalDishes > 0 
            ? Math.round((totalModifiedDishes / totalDishes) * 100) 
            : 0;

        return {
            proteinDistribution: {
                pollo: proteinPct(polloCount),
                res: proteinPct(resCount),
                cerdo: proteinPct(cerdoCount),
                pescado: proteinPct(pescadoCount),
            },
            customizationIndex,
            totalDishes,
            modifiedDishes: totalModifiedDishes,
            totalApprovals: approvals.length
        };
    }, [approvals]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
            {/* Header principal */}
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logo.src} alt="Grupo AVE" className="h-12 w-auto object-contain brightness-110 flex-shrink-0" />
                        <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                        <div className="hidden sm:block">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] block leading-none mb-1">Grupo AVE</span>
                            <h1 className="text-xs font-bold uppercase tracking-wide leading-none text-slate-400">Dashboard Central</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400 font-bold hidden md:inline truncate max-w-[180px]">
                            {user?.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 rounded-xl transition-all border border-slate-700/80 hover:border-red-900/50 text-slate-300 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden md:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                {/* Sección de Analíticas del Comedor */}
                <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
                        <div>
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] block">Estadísticas de Consumo</span>
                            <h2 className="text-xl font-bold uppercase tracking-wide text-white">Analíticas del Comedor</h2>
                        </div>
                        <div className="px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs text-slate-400 font-medium">
                            Basado en las últimas <strong className="text-blue-400 font-bold">{analytics.totalApprovals}</strong> aprobaciones
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {/* Índice de Personalización */}
                        <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                            <div className="space-y-2 flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Índice de Personalización</span>
                                <div className="text-3xl font-black text-white">
                                    {analytics.customizationIndex}%
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto sm:mx-0">
                                    Porcentaje de platillos sugeridos que fueron ajustados por el comité de la maquila.
                                </p>
                                <div className="text-[11px] text-slate-400 font-medium">
                                    <strong className="text-blue-400 font-bold">{analytics.modifiedDishes}</strong> modificados de <strong className="text-slate-300 font-bold">{analytics.totalDishes}</strong> en total
                               </div>
                            </div>
                            
                            {/* Visual Ring Gauge */}
                            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-800"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-blue-500 transition-all duration-1000 ease-out"
                                        strokeWidth="3.5"
                                        strokeDasharray={`${analytics.customizationIndex}, 100`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-xs font-black text-white">{analytics.customizationIndex}%</span>
                            </div>
                        </div>

                        {/* Distribución de Proteínas */}
                        <div className="md:col-span-2 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tendencias de Proteína Elegida</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Pollo */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-350 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                            Pollo
                                        </span>
                                        <span className="text-white font-bold">{analytics.proteinDistribution.pollo}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${analytics.proteinDistribution.pollo}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Res */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-350 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                            Res
                                        </span>
                                        <span className="text-white font-bold">{analytics.proteinDistribution.res}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${analytics.proteinDistribution.res}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Cerdo */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-350 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                                            Cerdo (Puerco)
                                        </span>
                                        <span className="text-white font-bold">{analytics.proteinDistribution.cerdo}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${analytics.proteinDistribution.cerdo}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Pescado */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-350 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                                            Pescado / Mariscos
                                        </span>
                                        <span className="text-white font-bold">{analytics.proteinDistribution.pescado}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${analytics.proteinDistribution.pescado}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                    {/* Panel de plantas */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-wider text-white">Plantas de Operación</h2>
                            <div className="h-1 w-20 bg-blue-500 rounded-full mt-2" />
                        </div>

                        {plantsEmpty && (
                            <div className="p-5 bg-blue-950/40 border border-blue-850 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white text-sm uppercase">⚠️ Base de datos de plantas vacía</h4>
                                    <p className="text-xs text-slate-400">Genera las configuraciones de planta en tu base de datos de Firestore en un clic (Contraseña inicial: AVE2026).</p>
                                </div>
                                <button
                                    onClick={handleInitializePlants}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase text-white tracking-widest shadow-lg shadow-blue-500/15 transition-all"
                                >
                                    Inicializar Plantas
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.values(PLANTS).map((plant: PlantConfig) => {
                                const countdown = getPlantCountdown(plant.id);
                                return (
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        key={plant.id}
                                        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-900/60 transition-all shadow-xl group relative overflow-hidden"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
                                                        {plant.location}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-white uppercase group-hover:text-blue-400 transition-colors">
                                                        {plant.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Empresa: <strong className="text-slate-300">{plant.companyName}</strong> <br />
                                                Categorías: {plant.categories?.length || (plant.isMultiBar ? 'Múltiples barras' : 0)} definidas.
                                            </p>

                                            {countdown && countdown.hasActiveMenu && (
                                                <div className={cn(
                                                    "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border w-fit transition-all duration-300",
                                                    countdown.isUrgent
                                                        ? "bg-red-950/40 border-red-800 text-red-400 animate-pulse shadow-md shadow-red-500/5"
                                                        : "bg-blue-950/40 border-blue-900 text-blue-400 shadow-md shadow-blue-500/5"
                                                )}>
                                                    <Clock className={cn("w-3.5 h-3.5", countdown.isUrgent && "animate-pulse")} />
                                                    <span>Cierre: {countdown.text}</span>
                                                </div>
                                            )}
                                        </div>

                                    <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                                        <div className="flex flex-wrap items-center gap-2 justify-start">
                                            {plant.isMultiBar && (
                                                <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-900/50 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    Multibar
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleCopyLink(plant.id)}
                                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-xl border border-slate-800 hover:border-slate-650 transition-colors flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest w-full sm:w-auto justify-center"
                                                title="Copiar enlace de selección para WhatsApp o Correo"
                                            >
                                                <Link className="w-3.5 h-3.5 text-blue-400" />
                                                <span>Copiar Link</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/admin/${plant.id}/manage`)}
                                            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 hover:text-white group/btn transition-colors py-1.5 justify-center sm:justify-end"
                                        >
                                            Cargar Menú
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )})}
                        </div>
                    </div>

                    {/* Notificaciones y Alertas en tiempo real */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-3">
                                <Bell className="w-5 h-5 text-blue-500 animate-pulse" />
                                Aprobaciones Recientes
                            </h2>
                            <span className="px-2 py-0.5 bg-blue-950 text-blue-400 rounded-full text-[9px] font-bold uppercase border border-blue-900/50">
                                En vivo
                            </span>
                        </div>

                        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {approvals.length === 0 ? (
                                    <p className="text-slate-500 text-sm italic py-8 text-center">No se han registrado aprobaciones esta semana.</p>
                                ) : (
                                    approvals.map((alert) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={alert.id}
                                            className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                                                        {alert.plantName}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-slate-500 font-medium">
                                                    {formatDate(alert.approvedAt)}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                    Semana del {alert.weekStartDate}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                                    {alert.approvedBy}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                    <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                                                    {alert.role}
                                                </div>
                                            </div>

                                            {alert.modifiedDishesCount > 0 && (
                                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Platillos Personalizados:
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-full text-[9px] font-bold">
                                                        {alert.modifiedDishesCount}
                                                    </span>
                                                </div>
                                            )}

                                            {alert.changeLog && alert.changeLog.length > 0 && (
                                                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                            Auditoría de Cambios:
                                                        </span>
                                                        <button
                                                            onClick={() => toggleExpandApproval(alert.id)}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                                                        >
                                                            {expandedApprovalId === alert.id ? 'Ocultar' : 'Ver Cambios'}
                                                            <span className="px-1 py-0.2 bg-blue-950 text-blue-300 rounded text-[8px] font-semibold">
                                                                {alert.changeLog.length}
                                                            </span>
                                                        </button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedApprovalId === alert.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden mt-3 space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px]"
                                                            >
                                                                {alert.changeLog.map((change, idx) => (
                                                                    <div key={idx} className="pb-2 border-b border-slate-900/50 last:border-b-0 last:pb-0">
                                                                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase mb-1">
                                                                            <span>{change.day}</span>
                                                                            <span>{CATEGORY_LABELS[change.category] || change.category}</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-start gap-1">
                                                                                <span className="text-[9px] px-1 py-0.2 bg-red-950 text-red-400 rounded font-black">SUG</span>
                                                                                <span className="text-red-400 line-through truncate block max-w-[200px]">{change.original}</span>
                                                                            </div>
                                                                            <div className="flex items-start gap-1">
                                                                                <span className="text-[9px] px-1 py-0.2 bg-green-950 text-green-400 rounded font-black">SEL</span>
                                                                                <span className="text-green-400 font-medium truncate block max-w-[200px]">{change.selected}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
