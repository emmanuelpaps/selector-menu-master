'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dish } from '../data/menu';

interface DishCellProps {
    dish: Dish;
    onUpdate: (newName: string) => void;
    isModified: boolean;
    openUpwards?: boolean;
    isLastCol?: boolean;
    openLeftwards?: boolean;
}

export const DishCell: React.FC<DishCellProps> = ({ dish, onUpdate, isModified, openUpwards, isLastCol, openLeftwards }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customInput, setCustomInput] = useState('');

    // Keep original name in options so it doesn't disappear when selecting an alternative
    const options = Array.from(new Set([dish.name, dish.originalName || dish.name, ...dish.alternatives]));

    const getProteinStyles = (type?: 'pollo' | 'res' | 'puerco' | 'marisco') => {
        if (!type) return "border-l-2";
        const styles = {
            pollo: "border-l-[6px] !border-l-yellow-400 bg-yellow-50/50",
            res: "border-l-[6px] !border-l-red-500 bg-red-50/50",
            puerco: "border-l-[6px] !border-l-pink-400 bg-pink-50/50",
            marisco: "border-l-[6px] !border-l-sky-400 bg-sky-50/50"
        };
        return styles[type];
    };

    return (
        <div className="relative group">
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-300 min-h-[100px] flex flex-col justify-between",
                    isModified
                        ? "!border-ave-blue bg-blue-50/50 shadow-md"
                        : "border-transparent bg-white hover:border-ave-gray hover:shadow-sm",
                    getProteinStyles(dish.proteinType)
                )}
            >
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ave-slate mb-1 block">
                        {isModified ? '✓ Modificado' : 'Sugerencia'}
                    </span>
                    <p className={cn(
                        "text-sm font-semibold leading-tight break-words",
                        isModified ? "text-ave-blue" : "text-ave-navy"
                    )}>
                        {dish.name}
                    </p>
                </div>
                <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw size={14} className="text-ave-slate" />
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => {
                                setIsOpen(false);
                                setIsCustomMode(false);
                                setCustomInput('');
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: openUpwards ? -10 : 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: openUpwards ? -10 : 10, scale: 0.95 }}
                            className={cn(
                                "absolute z-50 w-[90vw] max-w-[450px] md:w-[450px] bg-white rounded-xl shadow-2xl border border-ave-gray overflow-hidden overflow-y-auto max-h-[60vh]",
                                openUpwards ? "bottom-full mb-2" : "top-full mt-2",
                                (isLastCol || openLeftwards) ? "right-0" : "left-0"
                            )}
                        >
                            <div className="p-3 border-b border-ave-gray bg-gray-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-ave-slate">Cambiar platillo</span>
                                <ChevronDown size={14} className="text-ave-slate" />
                            </div>
                            <div className="py-1">
                                {options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            onUpdate(opt);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between break-words",
                                            opt === dish.name
                                                ? "bg-ave-navy text-white"
                                                : "hover:bg-ave-gray text-ave-navy"
                                        )}
                                    >
                                        <span className="pr-4 break-words whitespace-normal flex-1">{opt}</span>
                                        {opt === dish.name && <Check size={14} />}
                                    </button>
                                ))}
                                
                                {isCustomMode ? (
                                    <div className="p-3 border-t border-ave-gray mt-1 bg-white">
                                        <label className="text-[10px] font-bold uppercase tracking-tighter text-ave-slate mb-2 block">Cargar Platillo Manualmente</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Ej. Tacos de Barbacoa..." 
                                                className="flex-1 px-3 py-2 text-sm border border-ave-gray rounded-md hover:border-ave-blue focus:border-ave-blue focus:outline-none"
                                                value={customInput}
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && customInput.trim()) {
                                                        onUpdate(customInput.trim());
                                                        setIsOpen(false);
                                                        setIsCustomMode(false);
                                                        setCustomInput('');
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <button 
                                                type="button"
                                                className="px-4 bg-ave-navy hover:bg-ave-blue text-white rounded-md text-xs font-bold transition-colors"
                                                onClick={() => {
                                                    if (customInput.trim()) {
                                                        onUpdate(customInput.trim());
                                                        setIsOpen(false);
                                                        setIsCustomMode(false);
                                                        setCustomInput('');
                                                    }
                                                }}
                                            >
                                                OK
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsCustomMode(true)}
                                        className="w-full text-left px-4 py-3 text-sm transition-colors text-ave-blue font-bold hover:bg-blue-50 border-t border-ave-gray"
                                    >
                                        + Nueva Opción Manual
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
