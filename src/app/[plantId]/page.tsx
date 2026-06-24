'use client';

import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PLANTS, PlantConfig } from '../../config/plants';
import { DayMenu, BarType, STANDARD_CATEGORIES, WeeklyMenu } from '../../data/menu';
import { MenuTable } from '../../components/MenuTable';
import { getWeekDates, formatMenuRange } from '../../utils/dateUtils';
import { exportMenuToCSV } from '../../utils/csvExport';
import { generatePDF } from '../../services/pdfService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, 
    FileCheck, 
    User, 
    Briefcase, 
    AlertCircle, 
    Download, 
    Clock, 
    Check, 
    RefreshCcw, 
    Compass,
    FileSpreadsheet,
    Eye,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

// Branded Assets
import logo from '../../assets/logo.png';
import logoAptiv from '../../assets/logo_aptiv.png';
import logoJabil from '../../assets/logo_jabil.png';

export default function PlantSelector() {
    const params = useParams();
    const router = useRouter();
    const plantId = params?.plantId as string;
    const plant = PLANTS[plantId];

    // Estados de datos
    const [weeks, setWeeks] = useState<WeeklyMenu[]>([]);
    const [allBars, setAllBars] = useState<Record<string, WeeklyMenu[]> | null>(null);
    const [activeBarId, setActiveBarId] = useState<string>('tradicional');
    const [currentWeekIdx, setCurrentWeekIdx] = useState(0);

    // Estados del usuario y expiración
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [masterPasswordInput, setMasterPasswordInput] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [error, setError] = useState('');
    const [modifiedDishes, setModifiedDishes] = useState<Set<string>>(new Set());

    // Cargar nombres/cargos locales
    useEffect(() => {
        if (plant) {
            setUserName(localStorage.getItem(`ave_user_name_${plant.id}`) || '');
            setUserRole(localStorage.getItem(`ave_user_role_${plant.id}`) || '');
        }
    }, [plant]);

    // Recuperar menús publicados de Firestore
    const fetchPublishedMenus = useCallback(async () => {
        if (!plant) return;
        setIsLoading(true);
        try {
            // Generador Mock si no hay Firebase configurado o si estamos en bypass
            const isMockMode = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id' || 
                               localStorage.getItem('ave_mock_logged_in') === 'true' ||
                               process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

            if (isMockMode) {
                console.warn("Usando datos locales simulados para el Selector de Planta.");
                
                // Intentar leer de LocalStorage primero (para soportar lo publicado desde el CMS local)
                const mockKeyPrefix = `mock_menu_${plantId}_`;
                const mockMenus: any[] = [];
                for (let k = 0; k < localStorage.length; k++) {
                    const key = localStorage.key(k);
                    if (key && key.startsWith(mockKeyPrefix)) {
                        try {
                            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                            if (parsed.status === 'published') {
                                mockMenus.push(parsed);
                            }
                        } catch (e) {}
                    }
                }

                if (mockMenus.length > 0) {
                    const barsMap: Record<string, WeeklyMenu[]> = {};
                    mockMenus.forEach(data => {
                        Object.keys(data.bars || {}).forEach(barId => {
                            if (!barsMap[barId]) barsMap[barId] = [];
                            barsMap[barId].push({
                                mondayDate: data.weekStartDate,
                                menu: data.bars[barId].menu,
                                expirationDate: data.expirationDate
                            });
                        });
                    });
                    
                    const activeBars = Object.keys(barsMap);
                    if (activeBars.length > 0) {
                        activeBars.forEach(barId => {
                            barsMap[barId].sort((a, b) => a.mondayDate.localeCompare(b.mondayDate));
                        });
                        setAllBars(barsMap);
                        const primaryBar = barsMap['tradicional'] || barsMap[activeBars[0]];
                        setWeeks(primaryBar);
                        setIsOffline(false);
                        setIsLoading(false);
                        return;
                    }
                }

                // Generar menú simulado detallado según las reglas de la planta si no hay nada publicado
                const mondayDate = '2026-06-01';
                const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
                if (plantId === 'monclova') days.push('Viernes 3er Turno');
                if (plantId === 'jabil_cuu') days.push('Sábado', 'Domingo');

                const activeBars = plant.isMultiBar && plant.barsConfig 
                    ? plant.barsConfig 
                    : [{ id: 'tradicional', label: 'Tradicional', categories: plant.categories || STANDARD_CATEGORIES }];

                const barsMap: Record<string, WeeklyMenu[]> = {};
                activeBars.forEach(bar => {
                    barsMap[bar.id] = [{
                        mondayDate: mondayDate,
                        menu: days.map((day, idx) => ({
                            day,
                            date: `0${idx + 1}/06`,
                            dishes: bar.categories.map(cat => {
                                const defaultName = cat.includes('desayuno') 
                                    ? `Huevos con jamón (${day})`
                                    : cat.includes('sopa')
                                        ? `Sopa del día (${day})`
                                        : cat.includes('postre')
                                            ? `Flan casero (${day})`
                                            : `Guisado de ${idx % 2 === 0 ? 'pollo' : 'res'} (${day})`;

                                return {
                                    id: `mock-${bar.id}-${cat}-${day.toLowerCase()}`,
                                    type: cat,
                                    name: defaultName,
                                    alternatives: [`Opción B ${cat.replace(/_/g, ' ')}`, `Opción C ${cat.replace(/_/g, ' ')}`],
                                    proteinType: idx % 2 === 0 ? 'pollo' : 'res'
                                };
                            })
                        }))
                    }];
                });

                setAllBars(barsMap);
                setWeeks(barsMap[activeBars[0].id]);
                setIsOffline(false);
                setIsLoading(false);
                return;
            }

            const menusRef = collection(db, 'menus');
            const q = query(
                menusRef, 
                where('plantId', '==', plantId), 
                where('status', '==', 'published')
            );
            const querySnapshot = await getDocs(q);
            
            const weeksList: WeeklyMenu[] = [];
            const barsMap: Record<string, WeeklyMenu[]> = {};

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                


                // Cargar barras
                Object.keys(data.bars || {}).forEach(barId => {
                    if (!barsMap[barId]) barsMap[barId] = [];
                    barsMap[barId].push({
                        mondayDate: data.weekStartDate,
                        menu: data.bars[barId].menu,
                        expirationDate: data.expirationDate
                    });
                });
            });

            // Ordenar semanas cronológicamente
            const activeBars = Object.keys(barsMap);
            if (activeBars.length > 0) {
                // Ordenar cada barra por su fecha del Lunes
                activeBars.forEach(barId => {
                    barsMap[barId].sort((a, b) => a.mondayDate.localeCompare(b.mondayDate));
                });
                setAllBars(barsMap);
                
                // Tomar la barra por defecto para la lista principal de semanas
                const primaryBar = barsMap['tradicional'] || barsMap[activeBars[0]];
                setWeeks(primaryBar);
                setIsOffline(false);
            } else {
                setWeeks([]);
                setAllBars(null);
                setIsOffline(true); // Bloquear pantalla por falta de menús publicados activos
            }
        } catch (err) {
            console.error("Error fetching menus from Firestore:", err);
            setError('Error al conectar con la base de datos.');
        } finally {
            setIsLoading(false);
        }
    }, [plantId, plant]);

    useEffect(() => {
        if (plant) {
            fetchPublishedMenus();
        }
    }, [fetchPublishedMenus, plant]);

    // Menús de la barra y semana activa
    const displayedWeeks = useMemo(() => {
        if (plant?.isMultiBar && allBars) {
            return allBars[activeBarId] || [];
        }
        return weeks;
    }, [plant, allBars, activeBarId, weeks]);

    const activeWeek = useMemo(() => displayedWeeks[currentWeekIdx], [displayedWeeks, currentWeekIdx]);



    // Manejar el cambio de platillo por parte de la maquila
    const handleUpdateDish = (dayIdx: number, dishId: string, newName: string) => {
        if (isApproved) {
            toast.error('El menú ya está aprobado, no se pueden realizar cambios.');
            return;
        }

        if (plant?.isMultiBar && allBars) {
            setAllBars(prev => {
                if (!prev) return prev;
                const nextBars = { ...prev };
                const nextWeeks = [...nextBars[activeBarId]];
                const nextWeek = { ...nextWeeks[currentWeekIdx] };
                const nextMenu = [...nextWeek.menu];
                const nextDay = { ...nextMenu[dayIdx] };

                nextDay.dishes = nextDay.dishes.map(d => d.id === dishId ? { ...d, name: newName } : d);
                nextMenu[dayIdx] = nextDay;
                nextWeek.menu = nextMenu;
                nextWeeks[currentWeekIdx] = nextWeek;
                nextBars[activeBarId] = nextWeeks;
                return nextBars;
            });
        } else {
            setWeeks(prevWeeks => {
                const nextWeeks = [...prevWeeks];
                const nextWeek = { ...nextWeeks[currentWeekIdx] };
                const nextMenu = [...nextWeek.menu];
                const nextDay = { ...nextMenu[dayIdx] };
                nextDay.dishes = nextDay.dishes.map(d => d.id === dishId ? { ...d, name: newName } : d);
                nextMenu[dayIdx] = nextDay;
                nextWeek.menu = nextMenu;
                nextWeeks[currentWeekIdx] = nextWeek;
                return nextWeeks;
            });
        }

        setModifiedDishes(prev => {
            const next = new Set(prev);
            next.add(dishId);
            return next;
        });
    };

    // Confirmar aprobación
    const handleApprove = async () => {
        if (!userName.trim() || !userRole.trim()) {
            toast.error('Por favor complete su nombre y cargo.');
            return;
        }

        if (!masterPasswordInput.trim()) {
            toast.error('Por favor digite la contraseña maestra para firmar.');
            return;
        }

        setIsLoading(true);
        try {
            const isMockMode = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id' || 
                               localStorage.getItem('ave_mock_logged_in') === 'true' ||
                               process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

            // Calcular bitácora de auditoría (changeLog)
            const changeLog: Array<{ day: string; category: string; original: string; selected: string }> = [];
            activeWeek.menu.forEach(day => {
                day.dishes.forEach(dish => {
                    if (dish.originalName && dish.name !== dish.originalName && dish.originalName !== '-') {
                        changeLog.push({
                            day: day.day,
                            category: dish.type,
                            original: dish.originalName,
                            selected: dish.name
                        });
                    }
                });
            });

            if (isMockMode) {
                const validPassword = 'AVE2026';
                if (masterPasswordInput.trim() !== validPassword) {
                    toast.error('Contraseña maestra inválida (La contraseña local es AVE2026).');
                    setIsLoading(false);
                    return;
                }

                // Guardar aprobación en LocalStorage para simulación
                const approvalsKey = 'mock_approvals';
                const currentApprovals = JSON.parse(localStorage.getItem(approvalsKey) || '[]');
                const newApproval = {
                    id: `mock-approval-${Date.now()}`,
                    plantId,
                    plantName: plant.name,
                    weekStartDate: activeWeek.mondayDate,
                    approvedAt: new Date().toISOString(),
                    approvedBy: userName.trim(),
                    role: userRole.trim(),
                    modifiedDishesCount: modifiedDishes.size,
                    changeLog,
                    selectedMenu: activeWeek.menu
                };
                currentApprovals.unshift(newApproval);
                localStorage.setItem(approvalsKey, JSON.stringify(currentApprovals));
            } else {
                // Leer la contraseña maestra configurada para la planta
                const plantDocRef = doc(db, 'plants', plantId);
                const plantSnap = await getDoc(plantDocRef);
                
                // Contraseña por defecto si no está en la base de datos
                let validPassword = 'AVE_DEFAULT_PASSWORD';
                if (plantSnap.exists()) {
                    validPassword = plantSnap.data().masterPassword;
                }

                if (masterPasswordInput.trim() !== validPassword) {
                    toast.error('Contraseña maestra inválida.');
                    setIsLoading(false);
                    return;
                }

                // Guardar aprobación en Firestore
                const approvalPayload = {
                    plantId,
                    plantName: plant.name,
                    weekStartDate: activeWeek.mondayDate,
                    approvedAt: new Date().toISOString(),
                    approvedBy: userName.trim(),
                    role: userRole.trim(),
                    modifiedDishesCount: modifiedDishes.size,
                    changeLog,
                    selectedMenu: activeWeek.menu // Copia de auditoría del menú
                };

                await addDoc(collection(db, 'approvals'), approvalPayload);
            }

            // Guardar localmente datos del firmante
            localStorage.setItem(`ave_user_name_${plant.id}`, userName.trim());
            localStorage.setItem(`ave_user_role_${plant.id}`, userRole.trim());

            // Efecto de celebración
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });

            setIsApproved(true);
            toast.success('¡Menú aprobado y firmado exitosamente!');
        } catch (err) {
            console.error('Error al aprobar:', err);
            toast.error('Error al registrar la aprobación.');
        } finally {
            setIsLoading(false);
        }
    };

    // Descarga de PDF
    const handleDownloadPDF = async () => {
        if (!userName.trim() || !userRole.trim()) {
            toast.error('Por favor complete su nombre y cargo.');
            return;
        }
        
        const dataToExport = (plant.isMultiBar && allBars) ? allBars : displayedWeeks;
        const secondaryLogoToUse = plant.logoJabilEnabled ? logoJabil.src : (plant.logoAptivEnabled ? logoAptiv.src : '');
        await generatePDF(dataToExport, userName, userRole, logo.src, secondaryLogoToUse, plant.name, plant.companyName, modifiedDishes);
        toast.success('PDF generado con éxito');
    };

    // Descarga de CSV Editable
    const handleDownloadCSV = () => {
        const barLabel = plant.isMultiBar ? plant.barsConfig?.find(b => b.id === activeBarId)?.label : undefined;
        exportMenuToCSV(activeWeek.menu, plant.name, formatMenuRange(activeWeek.mondayDate), barLabel);
        toast.success('CSV descargado con éxito');
    };

    // Aprobación WhatsApp
    const handleWhatsApp = () => {
        if (!userName.trim() || !userRole.trim()) {
            toast.error('Por favor complete su nombre y cargo.');
            return;
        }

        const menuRange = formatMenuRange(activeWeek.mondayDate).toUpperCase();
        const approvalDate = new Date().toLocaleString();

        let message = `📋 *${plant.whatsappMessagePrefix}*\n`;
        message += `*CALENDARIO:* ${menuRange}\n`;
        message += `*FECHA APROBACIÓN:* ${approvalDate}\n\n`;
        message += `*Empresa:* ${plant.companyName}\n`;
        message += `*Planta:* ${plant.name}\n`;
        message += `*Aprobado por:* ${userName.toUpperCase()} - ${userRole.toUpperCase()}\n\n`;

        if (plant.isMultiBar && plant.barsConfig && allBars) {
            plant.barsConfig.forEach((bar) => {
                const barWeek = allBars[bar.id][currentWeekIdx];
                if (!barWeek) return;

                message += `--- *BARRA ${bar.label.toUpperCase()}* ---\n`;
                barWeek.menu.forEach(day => {
                    message += `📅 *${day.day}*\n`;
                    day.dishes.forEach(dish => {
                        const isMod = modifiedDishes.has(dish.id);
                        message += `  • ${dish.name}${isMod ? ' *(Selección Alternativa)*' : ''}\n`;
                    });
                });
                message += `\n`;
            });
        } else {
            activeWeek.menu.forEach(day => {
                message += `📅 *${day.day} (${day.date})*\n`;
                const categoriesToRender = plant.categories || STANDARD_CATEGORIES;

                categoriesToRender.forEach(catKey => {
                    const dish = day.dishes.find(d => d.type === catKey);
                    if (dish && dish.name && dish.name !== '-') {
                        const isMod = modifiedDishes.has(dish.id);
                        message += `  • ${dish.name}${isMod ? ' *(Selección Alternativa)*' : ''}\n`;
                    }
                });
                message += `\n`;
            });
        }

        message += `⚖️ *Nota:* Cumplimiento con la norma *NOM-251-SSA1-2009*.\n`;
        
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${plant.whatsappNumber}?text=${encoded}`, '_blank');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <span className="text-sm text-slate-500 font-bold uppercase tracking-widest">Cargando selector...</span>
            </div>
        );
    }

    if (isOffline) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-950/80 border border-slate-800 rounded-3xl p-12 shadow-2xl space-y-8"
                >
                    <div className="w-20 h-20 bg-red-950/50 border border-red-900/50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Acceso Cerrado</h1>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            No hay menús programados o el período de selección ha finalizado para {plant?.name || 'esta planta'}.
                        </p>
                    </div>
                    <button
                        onClick={() => startTransition(() => router.push('/'))}
                        className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-xs font-black uppercase text-white rounded-xl transition-all"
                    >
                        Volver al Portal
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-32">
            <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6 flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="flex items-center gap-4 md:gap-8">
                        <img
                            src={logo.src}
                            alt="Grupo AVE Logo"
                            className="h-10 md:h-12 w-auto object-contain"
                        />
                        <div className="h-6 md:h-8 w-px bg-white/20" />
                        {plant.logoAptivEnabled && (
                            <>
                                <img
                                    src={logoAptiv.src}
                                    alt="Aptiv Logo"
                                    className="h-8 md:h-10 w-auto object-contain brightness-0 invert"
                                />
                                <div className="h-6 md:h-8 w-px bg-white/20" />
                            </>
                        )}
                        {plant.logoJabilEnabled && (
                            <>
                                <img
                                    src={logoJabil.src}
                                    alt="Jabil Logo"
                                    className="h-4 md:h-5 w-auto object-contain brightness-0 invert"
                                />
                                <div className="h-6 md:h-8 w-px bg-white/20" />
                            </>
                        )}
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] leading-tight">Planta</span>
                            <span className="text-xs md:text-sm font-black text-white leading-none uppercase">{plant.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-center md:justify-end">
                        <div className="bg-white/10 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white whitespace-nowrap">
                                {activeWeek ? formatMenuRange(activeWeek.mondayDate) : 'Cargando...'}
                            </span>
                        </div>
                        <button
                            onClick={() => startTransition(() => router.push('/'))}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white transition-all whitespace-nowrap"
                        >
                            Cambiar Planta
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12">


                {/* Selector de Semanas publicadas */}
                {displayedWeeks.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
                        {displayedWeeks.map((week, idx) => (
                            <button
                                key={week.mondayDate}
                                onClick={() => {
                                    setCurrentWeekIdx(idx);
                                    setModifiedDishes(new Set());
                                    setIsApproved(false);
                                }}
                                className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex-shrink-0 ${
                                    currentWeekIdx === idx
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                Semana {idx + 1}
                                <span className="block text-[8px] opacity-65 font-medium whitespace-nowrap mt-0.5">
                                    {formatMenuRange(week.mondayDate).replace('del ', '')}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Selector de Barras */}
                {plant.isMultiBar && plant.barsConfig && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none w-full">
                        {plant.barsConfig.map((bar) => (
                            <button
                                key={bar.id}
                                onClick={() => {
                                    setActiveBarId(bar.id);
                                    setModifiedDishes(new Set());
                                    setIsApproved(false);
                                }}
                                className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-3 flex-shrink-0 ${
                                    activeBarId === bar.id
                                        ? "shadow-md scale-102"
                                        : "bg-white text-slate-500 border-slate-200 opacity-70 hover:opacity-100"
                                }`}
                                style={{
                                    backgroundColor: activeBarId === bar.id ? bar.color : undefined,
                                    borderColor: activeBarId === bar.id ? bar.color : undefined,
                                    color: activeBarId === bar.id ? 'white' : undefined
                                }}
                            >
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                                {bar.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Info Header */}
                <section className="space-y-2 border-l-4 border-slate-900 pl-4 py-1">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                        {plant.isMultiBar ? `Barra ${plant.barsConfig?.find(b => b.id === activeBarId)?.label || activeBarId}` : 'Menú Semanal Tradicional'}
                    </h2>
                    <p className="text-slate-505 font-medium text-xs sm:text-sm leading-relaxed text-slate-500">
                        Haz clic sobre cualquier celda de platillo para elegir opciones alternativas o ingresar una manualmente.
                    </p>
                </section>

                {/* Tabla Interactiva */}
                <section>
                    {activeWeek && (
                        <MenuTable
                            menu={activeWeek.menu}
                            onUpdateDish={handleUpdateDish}
                            modifiedDishes={modifiedDishes}
                            barColor={plant.isMultiBar ? plant.barsConfig?.find(b => b.id === activeBarId)?.color : undefined}
                            categories={plant.categories || (plant.isMultiBar ? plant.barsConfig?.find(b => b.id === activeBarId)?.categories : undefined)}
                        />
                    )}
                </section>

                {/* Formulario de Aprobación */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-5 sm:p-8 border border-slate-200 relative overflow-hidden space-y-6 sm:space-y-8">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase flex items-center gap-3 border-b border-slate-100 pb-4">
                            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            Aprobación Digital y Firma
                        </h3>

                        {isApproved ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 sm:p-6 bg-green-50 border-2 border-green-500/20 rounded-2xl flex flex-col md:flex-row items-center gap-4 text-green-800"
                            >
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div className="space-y-1 text-center md:text-left">
                                    <h4 className="font-black text-base uppercase">Menú Aprobado con Éxito</h4>
                                    <p className="text-xs font-semibold text-green-700 leading-normal">
                                        El menú ha sido firmado por {userName.toUpperCase()} ({userRole.toUpperCase()}). Ya puedes descargar tus formatos.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-blue-600" /> Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        placeholder="EJ: ING. JUAN PÉREZ"
                                        className="industrial-input text-sm text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-505 flex items-center gap-2 text-slate-500">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Posición / Cargo
                                    </label>
                                    <input
                                        type="text"
                                        value={userRole}
                                        onChange={(e) => setUserRole(e.target.value)}
                                        placeholder="EJ: GERENTE DE PLANTA"
                                        className="industrial-input text-sm text-slate-900"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            {!isApproved && (
                                <div className="max-w-md space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        Contraseña Maestra de Validación
                                    </label>
                                    <input
                                        type="password"
                                        value={masterPasswordInput}
                                        onChange={(e) => setMasterPasswordInput(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors duration-200 text-sm text-slate-900"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                                {!isApproved ? (
                                    <button
                                        onClick={handleApprove}
                                        className="btn-primary w-full sm:flex-1 group min-h-[50px]"
                                    >
                                        <FileCheck className="w-5 h-5" />
                                        <span>Firmar y Aprobar Menú</span>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="px-6 py-4 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 w-full sm:flex-1 justify-center shadow-lg"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Descargar PDF</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadCSV}
                                            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 w-full sm:flex-1 justify-center shadow-lg"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                                            <span>Descargar CSV</span>
                                        </button>
                                        {plantId !== 'juarez' && plantId !== 'jabil_cuu' && (
                                            <button
                                                onClick={handleWhatsApp}
                                                className="px-6 py-4 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 w-full sm:flex-1 justify-center shadow-lg"
                                            >
                                                <Send className="w-4 h-4" />
                                                <span>Aprobar WhatsApp</span>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reporte resumido */}
                    <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col justify-between gap-6">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-3 pb-4 border-b border-white/10">
                                Resumen del Reporte
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Semana:</span>
                                    <span className="text-sm font-bold">{activeWeek ? formatMenuRange(activeWeek.mondayDate) : '...'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-505 uppercase tracking-widest block text-slate-500">Planta:</span>
                                    <span className="text-sm font-bold uppercase">{plant.name}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Cambios realizados:</span>
                                    <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-full text-[9px] font-bold uppercase inline-block mt-1">
                                        {modifiedDishes.size} modificaciones
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
