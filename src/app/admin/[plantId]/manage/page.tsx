'use client';

import React, { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '../../../../lib/firebase';
import { PLANTS, PlantConfig } from '../../../../config/plants';
import { CATEGORY_LABELS, STANDARD_CATEGORIES } from '../../../../data/menu';
import { fixSpelling, detectProtein } from '../../../../utils/spellcheck';
import { getWeekDates, formatMenuRange } from '../../../../utils/dateUtils';
import { exportMenuToCSV } from '../../../../utils/csvExport';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { 
    ArrowLeft, 
    Save, 
    Send, 
    Copy, 
    FileSpreadsheet, 
    Plus, 
    Trash2, 
    Calendar, 
    Clock,
    Sparkles,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlantManage() {
    const params = useParams();
    const router = useRouter();
    const plantId = params?.plantId as string;
    const plant = PLANTS[plantId];

    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    // Configuración del Menú Semanal
    const [weekStart, setWeekStart] = useState(() => {
        // Lunes de la semana actual por defecto
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });

    const [expiration, setExpiration] = useState('');
    const [activeBar, setActiveBar] = useState('tradicional');
    const [loading, setLoading] = useState(false);
    const [cloning, setCloning] = useState(false);
    const [generatingMenu, setGeneratingMenu] = useState(false);
    const [status, setStatus] = useState<'draft' | 'published' | 'approved'>('draft');
    const [activeDayIdx, setActiveDayIdx] = useState(0);

    // Estructura de la grilla del menú editable
    // Record<barId, Record<dayIndex, Record<categoryKey, { name: string, alternatives: string[] }>>>
    const [menuData, setMenuData] = useState<Record<string, any>>({});
    const [loadedWeeks, setLoadedWeeks] = useState<Array<{ weekStartDate: string; status: string }>>([]);

    useEffect(() => {
        if (localStorage.getItem('ave_mock_logged_in') === 'true') {
            const userName = localStorage.getItem('ave_admin_name') || 'Administrador';
            setUser({ email: userName, uid: 'mock-admin-uid' });
            setAuthLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/admin/login');
            } else {
                setUser(currentUser);
                setAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Calcular días a mostrar según las reglas de planta
    const daysToShow = useMemo(() => {
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        if (plantId === 'monclova') {
            days.push('Viernes 3er Turno');
        }
        if (plantId === 'jabil_cuu') {
            days.push('Sábado', 'Domingo');
        }
        return days;
    }, [plantId]);

    // Reset active day index if it falls out of range of a smaller menu
    useEffect(() => {
        if (activeDayIdx >= daysToShow.length) {
            setActiveDayIdx(0);
        }
    }, [daysToShow.length, activeDayIdx]);

    // Categorías de la barra activa
    const categoriesToShow = useMemo(() => {
        if (plant?.isMultiBar && plant.barsConfig) {
            const barConf = plant.barsConfig.find(b => b.id === activeBar);
            return barConf?.categories || plant.categories || STANDARD_CATEGORIES;
        }
        return plant?.categories || STANDARD_CATEGORIES;
    }, [plant, activeBar]);

    // Inicializar o cargar el menú de la semana
    const loadMenu = async (targetDate: string) => {
        if (!plant) return;
        setLoading(true);
        try {
            const isMockMode = localStorage.getItem('ave_mock_logged_in') === 'true' || 
                               process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id';

            if (isMockMode) {
                const mockKey = `mock_menu_${plantId}_${targetDate}`;
                const saved = localStorage.getItem(mockKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    setStatus(data.status || 'draft');
                    setExpiration(data.expirationDate || '');
                    setMenuData(data.menuData || {});
                    toast.success('Menú cargado (Modo Local/Desarrollo)');
                } else {
                    setStatus('draft');
                    setMenuData({});
                    toast.success('Nueva plantilla de menú local inicializada');
                }
                setLoading(false);
                return;
            }

            const docRef = doc(db, 'menus', `${plantId}_${targetDate}`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setStatus(data.status || 'draft');
                setExpiration(data.expirationDate || '');
                
                // Mapear de Firestore a nuestro estado local
                const loadedData: Record<string, any> = {};
                Object.keys(data.bars || {}).forEach(barKey => {
                    loadedData[barKey] = {};
                    data.bars[barKey].menu.forEach((dayMenu: any, dayIdx: number) => {
                        loadedData[barKey][dayIdx] = {};
                        dayMenu.dishes.forEach((dish: any) => {
                            loadedData[barKey][dayIdx][dish.type] = {
                                name: dish.name,
                                alternatives: dish.alternatives || []
                            };
                        });
                    });
                });
                setMenuData(loadedData);
                toast.success('Menú cargado desde la base de datos');
            } else {
                // Inicializar vacío
                setStatus('draft');
                setMenuData({});
                toast.success('Nueva plantilla de menú inicializada');
            }
        } catch (error) {
            console.error('Error al cargar menú:', error);
            toast.error('No se pudo recuperar el menú');
        } finally {
            setLoading(false);
        }
    };

    const fetchLoadedWeeksList = useCallback(async () => {
        if (!plantId) return;
        try {
            const isMockMode = localStorage.getItem('ave_mock_logged_in') === 'true' || 
                               process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id';

            if (isMockMode) {
                const mockKeyPrefix = `mock_menu_${plantId}_`;
                const weeksList: any[] = [];
                for (let k = 0; k < localStorage.length; k++) {
                    const key = localStorage.key(k);
                    if (key && key.startsWith(mockKeyPrefix)) {
                        try {
                            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                            if (parsed.weekStartDate) {
                                weeksList.push({
                                    weekStartDate: parsed.weekStartDate,
                                    status: parsed.status || 'draft'
                                });
                            }
                        } catch (e) {}
                    }
                }
                weeksList.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
                setLoadedWeeks(weeksList);
                return;
            }

            const menusRef = collection(db, 'menus');
            const q = query(
                menusRef,
                where('plantId', '==', plantId)
            );
            const querySnapshot = await getDocs(q);
            const weeksList: any[] = [];
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.weekStartDate) {
                    weeksList.push({
                        weekStartDate: data.weekStartDate,
                        status: data.status || 'draft'
                    });
                }
            });
            weeksList.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
            setLoadedWeeks(weeksList);
        } catch (e) {
            console.error("Error fetching loaded weeks list:", e);
        }
    }, [plantId]);

    useEffect(() => {
        if (user && plantId) {
            fetchLoadedWeeksList();
        }
    }, [user, plantId, fetchLoadedWeeksList]);

    useEffect(() => {
        if (user && plant) {
            loadMenu(weekStart);
        }
    }, [user, weekStart, plantId]);

    // Clonar menú de una semana previa
    const handleClone = async () => {
        setCloning(true);
        try {
            const isMockMode = localStorage.getItem('ave_mock_logged_in') === 'true' || 
                               process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id';

            if (isMockMode) {
                // Buscar menús guardados en LocalStorage para esta planta
                const mockKeyPrefix = `mock_menu_${plantId}_`;
                const mockMenus: any[] = [];
                for (let k = 0; k < localStorage.length; k++) {
                    const key = localStorage.key(k);
                    if (key && key.startsWith(mockKeyPrefix) && key !== `mock_menu_${plantId}_${weekStart}`) {
                        try {
                            mockMenus.push(JSON.parse(localStorage.getItem(key) || '{}'));
                        } catch (e) {}
                    }
                }

                if (mockMenus.length === 0) {
                    toast.error('No hay menús guardados anteriormente de forma local para clonar.');
                    return;
                }

                // Tomar el más reciente (por fecha de lunes)
                mockMenus.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
                const data = mockMenus[0];
                setMenuData(data.menuData || {});
                toast.success(`Menú clonado (Modo Local) de la semana: ${data.weekStartDate}`);
                return;
            }

            const menusRef = collection(db, 'menus');
            const q = query(
                menusRef, 
                where('plantId', '==', plantId), 
                orderBy('weekStartDate', 'desc'), 
                limit(5)
            );
            const querySnapshot = await getDocs(q);

            // Filtrar el menú actual si está en la lista y tomar el más reciente
            const docs = querySnapshot.docs.filter(doc => doc.id !== `${plantId}_${weekStart}`);

            if (docs.length === 0) {
                toast.error('No hay menús guardados anteriormente para clonar.');
                return;
            }

            const sourceDoc = docs[0];
            const data = sourceDoc.data();
            
            // Clonar la estructura al estado local
            const clonedData: Record<string, any> = {};
            Object.keys(data.bars || {}).forEach(barKey => {
                clonedData[barKey] = {};
                data.bars[barKey].menu.forEach((dayMenu: any, dayIdx: number) => {
                    clonedData[barKey][dayIdx] = {};
                    dayMenu.dishes.forEach((dish: any) => {
                        clonedData[barKey][dayIdx][dish.type] = {
                            name: dish.name,
                            alternatives: dish.alternatives || []
                        };
                    });
                });
            });

            setMenuData(clonedData);
            toast.success(`Menú clonado con éxito de la semana: ${data.weekStartDate}`);
        } catch (error) {
            console.error('Error al clonar menú:', error);
            toast.error('Error al intentar clonar un menú anterior');
        } finally {
            setCloning(false);
        }
    };

    // Actualizar celdas del formulario
    const handleCellChange = (barId: string, dayIdx: number, catKey: string, field: 'name' | 'alternatives', value: string) => {
        setMenuData(prev => {
            const next = { ...prev };
            if (!next[barId]) next[barId] = {};
            if (!next[barId][dayIdx]) next[barId][dayIdx] = {};
            if (!next[barId][dayIdx][catKey]) {
                next[barId][dayIdx][catKey] = { name: '', alternatives: [] };
            }

            if (field === 'name') {
                next[barId][dayIdx][catKey].name = value;
            } else {
                next[barId][dayIdx][catKey].alternatives = value.split(',').map(s => s.trim()).filter(Boolean);
            }
            return next;
        });
    };

    // Corrección ortográfica al perder el foco (onBlur)
    const handleBlur = async (barId: string, dayIdx: number, catKey: string, field: 'name' | 'alternatives', rawValue: string) => {
        if (!rawValue.trim()) return;

        // Respaldo local determinista (Offline Fallback)
        const runLocalFallback = () => {
            if (field === 'name') {
                const corrected = fixSpelling(rawValue);
                handleCellChange(barId, dayIdx, catKey, 'name', corrected);
                if (corrected !== rawValue) {
                    toast.success('Ortografía corregida (Respaldo Local)', { icon: '✨', duration: 1000 });
                }
            } else {
                const items = rawValue.split(',').map(s => s.trim());
                const correctedItems = items.map(s => fixSpelling(s));
                handleCellChange(barId, dayIdx, catKey, 'alternatives', correctedItems.join(', '));
            }
        };

        try {
            // Intentar llamar a la API de Gemini
            const response = await fetch('/api/correct-spelling', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: rawValue,
                    type: field === 'name' ? 'suggested' : 'alternatives'
                })
            });

            if (!response.ok) {
                throw new Error('API Error or unconfigured key');
            }

            const data = await response.json();
            const correctedText = data.correctedText;

            if (correctedText && correctedText !== rawValue) {
                if (field === 'name') {
                    handleCellChange(barId, dayIdx, catKey, 'name', correctedText);
                } else {
                    handleCellChange(barId, dayIdx, catKey, 'alternatives', correctedText);
                }
                toast.success('Ortografía corregida por IA', { icon: '✨', duration: 1500 });
            }
        } catch (err) {
            console.warn('API de Gemini falló o no está configurada, usando respaldo local:', err);
            runLocalFallback();
        }
    };

    // Guardar borrador o publicar en Firestore
    const handleSave = async (publish: boolean) => {
        setLoading(true);
        try {
            // Generar fechas completas de cada día para el menú
            const dates = getWeekDates(weekStart, daysToShow.length);
            
            // Construir payload
            const barsPayload: Record<string, any> = {};
            const activeBars = plant.isMultiBar && plant.barsConfig 
                ? plant.barsConfig.map(b => b.id) 
                : ['tradicional'];

            activeBars.forEach(barId => {
                barsPayload[barId] = {
                    menu: daysToShow.map((dayLabel, dayIdx) => {
                        const dateInfo = dates[dayIdx] || { date: '', fullDate: '' };
                        
                        return {
                            day: dayLabel,
                            date: dayLabel === 'Viernes 3er Turno' ? dates[4]?.date || '' : dateInfo.date,
                            dishes: categoriesToShow.map(catKey => {
                                const localCell = menuData[barId]?.[dayIdx]?.[catKey] || { name: '', alternatives: [] };
                                return {
                                    id: `${barId}-${weekStart}-${dayLabel.toLowerCase()}-${catKey}`,
                                    type: catKey,
                                    name: localCell.name || '-',
                                    originalName: localCell.name || '-',
                                    alternatives: localCell.alternatives || [],
                                    proteinType: detectProtein(localCell.name) || null
                                };
                            })
                        };
                    })
                };
            });

            const targetStatus = publish ? 'published' : 'draft';

            const isMockMode = localStorage.getItem('ave_mock_logged_in') === 'true' || 
                               process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'dummy-project-id';

            if (isMockMode) {
                // Guardar en LocalStorage
                const mockKey = `mock_menu_${plantId}_${weekStart}`;
                localStorage.setItem(mockKey, JSON.stringify({
                    plantId,
                    weekStartDate: weekStart,
                    status: targetStatus,
                    expirationDate: expiration,
                    updatedAt: new Date().toISOString(),
                    bars: barsPayload,
                    menuData // Guardar el estado local del formulario de celdas para su posterior carga
                }));
            } else {
                const docRef = doc(db, 'menus', `${plantId}_${weekStart}`);
                await setDoc(docRef, {
                    plantId,
                    weekStartDate: weekStart,
                    status: targetStatus,
                    expirationDate: expiration,
                    updatedAt: new Date().toISOString(),
                    bars: barsPayload
                });
            }

            setStatus(targetStatus);
            toast.success(publish ? 'Menú publicado para la maquila' : 'Borrador guardado con éxito');
            fetchLoadedWeeksList();
        } catch (error) {
            console.error('Error al guardar menú:', error);
            toast.error('Error al guardar el menú en la base de datos');
        } finally {
            setLoading(false);
        }
    };

    // Exportar menú editado a CSV
    const handleCSVExport = () => {
        // Reconstruir lista de DayMenu para exportar la barra activa en pantalla
        const dates = getWeekDates(weekStart, daysToShow.length);
        const dayMenus = daysToShow.map((dayLabel, dayIdx) => {
            const dateInfo = dates[dayIdx] || { date: '', fullDate: '' };
            return {
                day: dayLabel,
                date: dayLabel === 'Viernes 3er Turno' ? dates[4]?.date || '' : dateInfo.date,
                dishes: categoriesToShow.map(catKey => {
                    const localCell = menuData[activeBar]?.[dayIdx]?.[catKey] || { name: '', alternatives: [] };
                    return {
                        id: `${activeBar}-${dayIdx}-${catKey}`,
                        type: catKey,
                        name: localCell.name || '-',
                        alternatives: localCell.alternatives || [],
                        proteinType: detectProtein(localCell.name)
                    };
                })
            };
        });

        const barLabel = plant.isMultiBar ? plant.barsConfig?.find(b => b.id === activeBar)?.label : undefined;
        exportMenuToCSV(dayMenus, plant.name, formatMenuRange(weekStart), barLabel);
    };

    const handleGenerateAIMenu = async () => {
        setGeneratingMenu(true);
        const loadToast = toast.loading('Generando propuesta balanceada con IA (Gemini)...');
        try {
            const response = await fetch('/api/generate-menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plantId, barId: activeBar })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Fallo al autogenerar');
            }

            const data = await response.json();
            
            const updatedMenuData = { ...menuData };
            if (!updatedMenuData[activeBar]) {
                updatedMenuData[activeBar] = {};
            }

            data.menu.forEach((dayItem: any) => {
                const dayIdx = dayItem.dayIndex;
                if (!updatedMenuData[activeBar][dayIdx]) {
                    updatedMenuData[activeBar][dayIdx] = {};
                }

                dayItem.dishes.forEach((dishItem: any) => {
                    updatedMenuData[activeBar][dayIdx][dishItem.type] = {
                        name: dishItem.name,
                        alternatives: dishItem.alternatives || []
                    };
                });
            });

            setMenuData(updatedMenuData);
            toast.success('¡Menú generado por IA precargado con éxito! Revisa los campos antes de guardar.', { id: loadToast, duration: 4000 });
        } catch (err: any) {
            console.error('Error al autogenerar menú con IA:', err);
            toast.error(err.message || 'No se pudo generar el menú con IA', { id: loadToast });
        } finally {
            setGeneratingMenu(false);
        }
    };

    if (authLoading || !plant) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => startTransition(() => router.push('/admin'))}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-0.5">Gestión de Planta</span>
                            <h1 className="text-xl font-bold uppercase tracking-wide leading-none">{plant.name}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
                        <button
                            onClick={handleCSVExport}
                            className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-300 shadow-sm"
                            title="Exportar a CSV"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Exportar CSV</span>
                            <span className="inline sm:hidden">CSV</span>
                        </button>

                        <button
                            onClick={handleGenerateAIMenu}
                            disabled={generatingMenu || loading}
                            className="px-3 sm:px-4 py-2 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-400 rounded-xl border border-indigo-900/50 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-sm shadow-indigo-500/5"
                            title="Generar menú semanal balanceado con IA (Gemini)"
                        >
                            {generatingMenu ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Generar con IA</span>
                            <span className="inline sm:hidden">IA</span>
                        </button>

                        <button
                            onClick={handleClone}
                            disabled={cloning || loading}
                            className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-sm"
                            title="Clonar menú de la semana anterior"
                        >
                            {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Clonar Anterior</span>
                            <span className="inline sm:hidden">Clonar</span>
                        </button>

                        <button
                            onClick={() => handleSave(false)}
                            disabled={loading}
                            className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 shadow-sm"
                            title="Guardar borrador de cambios"
                        >
                            <Save className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Guardar Borrador</span>
                            <span className="inline sm:hidden">Borrador</span>
                        </button>

                        <button
                            onClick={() => handleSave(true)}
                            disabled={loading}
                            className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 shadow-lg shadow-blue-500/10"
                            title="Publicar menú para la maquila"
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publicar</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Configuración semanal */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Semana de Carga (Lunes)
                        </label>
                        <input
                            type="date"
                            value={weekStart}
                            onChange={(e) => setWeekStart(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/60 border-2 border-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-white text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Cierre Límite de Aprobación
                        </label>
                        <input
                            type="datetime-local"
                            value={expiration}
                            onChange={(e) => setExpiration(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/60 border-2 border-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-white text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/40 px-6 py-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado Actual:</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${
                            status === 'published' 
                                ? 'bg-green-950/30 text-green-400 border-green-900/50' 
                                : status === 'approved'
                                    ? 'bg-blue-950/30 text-blue-400 border-blue-900/50'
                                    : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                            {status === 'published' ? 'Publicado' : status === 'approved' ? 'Aprobado' : 'Borrador'}
                        </span>
                    </div>
                </div>

                {/* Semanas ya registradas */}
                {loadedWeeks.length > 0 && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>Semanas registradas en el sistema (Haz clic para cargar y editar)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {loadedWeeks.map((w) => {
                                const isCurrent = w.weekStartDate === weekStart;
                                return (
                                    <button
                                        key={w.weekStartDate}
                                        onClick={() => {
                                            if (!loading) {
                                                setWeekStart(w.weekStartDate);
                                            }
                                        }}
                                        className={cn(
                                            "px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",
                                            isCurrent
                                                ? "bg-blue-600/20 border-blue-500 text-blue-300 font-black shadow-sm"
                                                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                                        )}
                                    >
                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                        <span>{formatMenuRange(w.weekStartDate)}</span>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                            w.status === 'published'
                                                ? "bg-green-950/30 text-green-400 border border-green-900/30"
                                                : w.status === 'approved'
                                                    ? "bg-blue-950/30 text-blue-400 border border-blue-900/30"
                                                    : "bg-slate-850 text-slate-400 border border-slate-800"
                                        )}>
                                            {w.status === 'published' ? 'Publicado' : w.status === 'approved' ? 'Aprobado' : 'Borrador'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Selector de barras si la planta es multibar */}
                {plant.isMultiBar && plant.barsConfig && (
                    <div className="flex flex-wrap gap-2 sm:gap-3 border-b border-slate-850 pb-4">
                        {plant.barsConfig.map((bar) => (
                            <button
                                key={bar.id}
                                onClick={() => setActiveBar(bar.id)}
                                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all ${
                                    activeBar === bar.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                {bar.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid Interactiva de Platillos (CMS) */}
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    )}

                    {/* Desktop View */}
                    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/20 shadow-2xl">
                        <table className="w-full border-collapse table-fixed min-w-[1200px]">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="w-48 bg-slate-900 text-slate-300 p-5 text-left border-r border-slate-800 uppercase tracking-widest text-[10px] font-black">
                                        Categoría
                                    </th>
                                    {daysToShow.map((dayLabel, idx) => (
                                        <th key={idx} className="bg-slate-900 text-slate-300 p-5 border-r last:border-r-0 border-slate-800 text-center">
                                            <div className="uppercase tracking-widest text-xs font-black">{dayLabel}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {categoriesToShow.map((catKey) => (
                                    <tr key={catKey} className="border-b border-slate-850 hover:bg-slate-900/20 transition-colors">
                                        <td className="p-4 border-r border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-wider bg-slate-900/10">
                                            {CATEGORY_LABELS[catKey] || catKey.replace(/_/g, ' ')}
                                        </td>
                                        {daysToShow.map((dayLabel, dayIdx) => {
                                            const cellVal = menuData[activeBar]?.[dayIdx]?.[catKey] || { name: '', alternatives: [] };
                                            
                                            return (
                                                <td key={dayIdx} className="p-3 border-r last:border-r-0 border-slate-800 align-top space-y-2">
                                                    {/* Input de Platillo Principal */}
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Sugerido</span>
                                                        <input
                                                            type="text"
                                                            value={cellVal.name}
                                                            onChange={(e) => handleCellChange(activeBar, dayIdx, catKey, 'name', e.target.value)}
                                                            onBlur={(e) => handleBlur(activeBar, dayIdx, catKey, 'name', e.target.value)}
                                                            placeholder="Nombre del platillo..."
                                                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg text-xs text-white placeholder-slate-700 transition-colors"
                                                        />
                                                    </div>

                                                    {/* Input de Alternativas */}
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Alternativas (separadas por comas)</span>
                                                        <textarea
                                                            value={cellVal.alternatives.join(', ')}
                                                            onChange={(e) => handleCellChange(activeBar, dayIdx, catKey, 'alternatives', e.target.value)}
                                                            onBlur={(e) => handleBlur(activeBar, dayIdx, catKey, 'alternatives', e.target.value)}
                                                            placeholder="Ej: Platillo Alt 1, Platillo Alt 2..."
                                                            rows={2}
                                                            className="w-full px-3 py-1.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg text-[11px] text-slate-300 placeholder-slate-700 transition-colors resize-none"
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="block lg:hidden space-y-6">
                        {/* Selector de días horizontal */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {daysToShow.map((dayLabel, idx) => {
                                const isActive = idx === activeDayIdx;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveDayIdx(idx)}
                                        className={cn(
                                            "flex-shrink-0 min-w-[110px] py-2.5 px-3 rounded-xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center text-xs font-black uppercase tracking-wider",
                                            isActive
                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                                        )}
                                    >
                                        {dayLabel}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Stack vertical de inputs */}
                        <div className="space-y-4">
                            {categoriesToShow.map((catKey) => {
                                const cellVal = menuData[activeBar]?.[activeDayIdx]?.[catKey] || { name: '', alternatives: [] };
                                return (
                                    <div key={catKey} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                                            {CATEGORY_LABELS[catKey] || catKey.replace(/_/g, ' ')}
                                        </div>
                                        
                                        {/* Input de Platillo Principal */}
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Sugerido</span>
                                            <input
                                                type="text"
                                                value={cellVal.name}
                                                onChange={(e) => handleCellChange(activeBar, activeDayIdx, catKey, 'name', e.target.value)}
                                                onBlur={(e) => handleBlur(activeBar, activeDayIdx, catKey, 'name', e.target.value)}
                                                placeholder="Nombre del platillo..."
                                                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:outline-none rounded-xl text-xs text-white placeholder-slate-700 transition-colors"
                                            />
                                        </div>

                                        {/* Input de Alternativas */}
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Alternativas (separadas por comas)</span>
                                            <textarea
                                                value={cellVal.alternatives.join(', ')}
                                                onChange={(e) => handleCellChange(activeBar, activeDayIdx, catKey, 'alternatives', e.target.value)}
                                                onBlur={(e) => handleBlur(activeBar, activeDayIdx, catKey, 'alternatives', e.target.value)}
                                                placeholder="Ej: Platillo Alt 1, Platillo Alt 2..."
                                                rows={3}
                                                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:outline-none rounded-xl text-[11px] text-slate-300 placeholder-slate-700 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
