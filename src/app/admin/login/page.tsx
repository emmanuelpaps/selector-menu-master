'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Delete, XCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import logo from '../../../assets/logo.png';

export default function AdminLogin() {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isError, setIsError] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (localStorage.getItem('ave_mock_logged_in') === 'true') {
            router.push('/admin');
            return;
        }
        setCheckingAuth(false);
    }, [router]);

    const handleKeyPress = (num: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
        }
    };

    const handleClear = () => {
        setPin('');
        setIsError(false);
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setIsError(false);
    };

    // Auto-submit when length reaches 6 digits
    useEffect(() => {
        if (pin.length === 6) {
            handleSubmit();
        }
    }, [pin]);

    // Handle physical keyboard input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (checkingAuth || loading) return;
            if (e.key >= '0' && e.key <= '9') {
                handleKeyPress(e.key);
            } else if (e.key === 'Backspace') {
                handleDelete();
            } else if (e.key === 'Escape') {
                handleClear();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin, checkingAuth, loading]);

const ADMIN_USERS: Record<string, string> = {
    '123456': 'Arturo Velarde',
    '121212': 'Veronica',
    '141414': 'Laura Ceniceros',
    '151515': 'Carlos Prieto',
    '161616': 'Eduardo Peralta',
    '171717': 'Mayra Velarde',
    '181818': 'Manuel Velarde'
};

    const handleSubmit = async () => {
        setLoading(true);
        // Esperar un momento corto para una transición visual más suave
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const userName = ADMIN_USERS[pin];
        if (userName) {
            localStorage.setItem('ave_mock_logged_in', 'true');
            localStorage.setItem('ave_admin_name', userName);
            toast.success(`Acceso concedido - ¡Bienvenido ${userName}!`);
            router.push('/admin');
        } else {
            setIsError(true);
            toast.error('PIN incorrecto. Intenta de nuevo.');
            setPin('');
            setLoading(false);
            // Desactivar estado de error después de la animación de shake
            setTimeout(() => setIsError(false), 500);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Botón flotante para regresar al Home */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl text-slate-200 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest z-20 shadow-md shadow-black/40"
                title="Regresar al inicio"
            >
                <ArrowLeft className="w-4 h-4 text-blue-400 stroke-[3]" />
                <span>Inicio</span>
            </button>

            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-slate-900/40 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative z-10 flex flex-col items-center"
            >
                <div className="text-center space-y-4 mb-6 w-full flex flex-col items-center">
                    <img src={logo.src} alt="Grupo AVE" className="h-16 w-auto object-contain mb-2 brightness-110 flex-shrink-0" />
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Acceso Administrativo</h1>
                    <p className="text-slate-400 text-xs font-medium leading-normal max-w-[280px] mx-auto">
                        Introduce el PIN de seguridad de 6 dígitos para gestionar los menús.
                    </p>
                </div>

                {/* Display dots for PIN */}
                <motion.div
                    animate={isError ? { x: [-10, 10, -10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center gap-3.5 my-6"
                >
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-205 ${
                                isError 
                                    ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/30' 
                                    : i < pin.length 
                                        ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50' 
                                        : 'border-slate-700 bg-slate-950/40'
                            }`}
                        />
                    ))}
                </motion.div>

                {/* Visual Tactile Keypad */}
                <div className="grid grid-cols-3 gap-4 max-w-[260px] mx-auto mt-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            key={num}
                            type="button"
                            onClick={() => handleKeyPress(num)}
                            disabled={loading}
                            className="w-16 h-16 rounded-full bg-slate-950/65 border border-slate-800/80 flex items-center justify-center text-xl font-black hover:border-slate-700 hover:bg-slate-900 transition-colors text-white disabled:opacity-50 shadow-md shadow-slate-950/20"
                        >
                            {num}
                        </motion.button>
                    ))}
                    
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={handleClear}
                        disabled={loading || pin.length === 0}
                        className="w-16 h-16 rounded-full bg-slate-950/40 border border-slate-850 flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-500 hover:border-red-900/40 hover:bg-red-950/15 hover:text-red-400 transition-colors disabled:opacity-30"
                        title="Limpiar"
                    >
                        <XCircle className="w-4 h-4 mb-0.5" />
                        Borrar
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        key="0"
                        type="button"
                        onClick={() => handleKeyPress('0')}
                        disabled={loading}
                        className="w-16 h-16 rounded-full bg-slate-950/65 border border-slate-800/80 flex items-center justify-center text-xl font-black hover:border-slate-700 hover:bg-slate-900 transition-colors text-white disabled:opacity-50 shadow-md shadow-slate-950/20"
                    >
                        0
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={handleDelete}
                        disabled={loading || pin.length === 0}
                        className="w-16 h-16 rounded-full bg-slate-950/40 border border-slate-850 flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-500 hover:border-slate-750 hover:bg-slate-900 hover:text-slate-300 transition-colors disabled:opacity-30"
                        title="Retroceso"
                    >
                        <Delete className="w-4 h-4 mb-0.5" />
                        Retro
                    </motion.button>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 mt-6 text-xs text-blue-400 font-bold uppercase tracking-widest animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando PIN...
                    </div>
                )}
            </motion.div>
        </div>
    );
}
