'use client';

import React, { useState, useEffect } from 'react';
import { DayMenu, CATEGORY_LABELS, STANDARD_CATEGORIES } from '../data/menu';
import { DishCell } from './DishCell';
import { cn } from '../lib/utils';

interface MenuTableProps {
    menu: DayMenu[];
    onUpdateDish: (dayIndex: number, dishId: string, newName: string) => void;
    modifiedDishes: Set<string>;
    barColor?: string;
    categories?: string[];
}

export const MenuTable: React.FC<MenuTableProps> = ({ menu, onUpdateDish, modifiedDishes, barColor, categories: customCategories }) => {
    const categories = customCategories || STANDARD_CATEGORIES;
    const [activeDayIdx, setActiveDayIdx] = useState(0);

    // Reset active day index if it falls out of range of a smaller menu
    useEffect(() => {
        if (activeDayIdx >= menu.length) {
            setActiveDayIdx(0);
        }
    }, [menu.length, activeDayIdx]);

    return (
        <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl shadow-2xl border border-ave-gray bg-white">
                <table className="w-full border-collapse table-fixed min-w-[1000px]">
                    <thead>
                        <tr>
                            <th
                                className="w-48 bg-ave-navy text-white p-6 text-left border-r border-white/10 uppercase tracking-widest text-xs font-black transition-colors"
                                style={{ backgroundColor: barColor || undefined }}
                            >
                                Categoría
                            </th>
                            {menu.map((day, idx) => (
                                <th
                                    key={idx}
                                    className="bg-ave-navy text-white p-6 border-r last:border-r-0 border-white/10 text-center transition-colors"
                                    style={{ backgroundColor: barColor || undefined }}
                                >
                                    <div className="uppercase tracking-widest text-lg font-black leading-none">{day.day}</div>
                                    <div className="text-[10px] text-blue-200 mt-1 uppercase font-bold tracking-tighter opacity-80"
                                        style={{ color: barColor ? 'white' : undefined }}>
                                        {day.date}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((catKey) => (
                            <tr key={catKey} className="group odd:bg-white even:bg-slate-50/50">
                                <td className="p-4 border-r border-ave-gray font-bold text-ave-slate text-xs uppercase tracking-wider bg-slate-50/10">
                                    {CATEGORY_LABELS[catKey]}
                                </td>
                                {menu.map((day, dayIdx) => {
                                    const dish = day.dishes.find(d => d.type === catKey);
                                    const isLastTwoRows = categories.indexOf(catKey) >= categories.length - 2;

                                    return (
                                        <td key={dayIdx} className="p-2 border-r last:border-r-0 border-ave-gray align-top">
                                            {dish ? (
                                                <DishCell
                                                    dish={dish}
                                                    isModified={modifiedDishes.has(dish.id)}
                                                    onUpdate={(newName) => onUpdateDish(dayIdx, dish.id, newName)}
                                                    openUpwards={isLastTwoRows}
                                                    openLeftwards={dayIdx >= 3}
                                                    isLastCol={dayIdx >= menu.length - 1}
                                                />
                                            ) : (
                                                <div className="h-full min-h-[100px] bg-slate-100/50 rounded-lg flex items-center justify-center border-2 border-transparent">
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">- N/A -</span>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Tabbed/Card View */}
            <div className="block md:hidden space-y-4">
                {/* Horizontal day tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {menu.map((day, idx) => {
                        const isActive = idx === activeDayIdx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveDayIdx(idx)}
                                className={cn(
                                    "flex-shrink-0 min-w-[100px] py-2.5 px-3 rounded-xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center",
                                    isActive
                                        ? "shadow-md bg-slate-50"
                                        : "border-transparent bg-white hover:border-ave-gray hover:shadow-sm"
                                )}
                                style={{
                                    borderColor: isActive ? (barColor || '#005ea6') : 'transparent',
                                }}
                            >
                                <span 
                                    className="text-xs font-black uppercase tracking-wider"
                                    style={{
                                        color: isActive ? (barColor || '#005ea6') : '#0c2340',
                                    }}
                                >
                                    {day.day}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                    {day.date}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Categories vertical stack */}
                {menu[activeDayIdx] && (
                    <div className="space-y-3">
                        {categories.map((catKey) => {
                            const dish = menu[activeDayIdx].dishes.find(d => d.type === catKey);
                            const isLastTwoRows = categories.indexOf(catKey) >= categories.length - 2;

                            return (
                                <div key={catKey} className="bg-white rounded-xl border border-ave-gray shadow-sm p-4 flex flex-col gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-ave-slate">
                                        {CATEGORY_LABELS[catKey]}
                                    </div>
                                    <div>
                                        {dish ? (
                                            <DishCell
                                                dish={dish}
                                                isModified={modifiedDishes.has(dish.id)}
                                                onUpdate={(newName) => onUpdateDish(activeDayIdx, dish.id, newName)}
                                                openUpwards={isLastTwoRows}
                                                openLeftwards={false}
                                                isLastCol={false}
                                            />
                                        ) : (
                                            <div className="min-h-[60px] bg-slate-100/50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">- N/A -</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
