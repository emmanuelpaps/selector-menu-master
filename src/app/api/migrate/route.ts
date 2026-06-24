import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { db } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { detectProtein } from '../../../utils/spellcheck';
import { getWeekDates } from '../../../utils/dateUtils';

export async function GET() {
    try {
        const monclovaUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmNuCVTxzyTIaJivjoIpBNnleClKEeLjowfx-sWgPp0tuncPpExaBdikFmw9CvIrtN9mX4fGv2d3lw/pub?gid=0&single=true&output=csv';
        const tijuanaUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt3Bbk5WY9txPbzWEl3Hf4ijY6V1tTw0M49l-_VJaZC_1qcTsyQ_-h77O0DTvQv7PNnzNjpgV4xEZ0/pub?gid=0&single=true&output=csv';

        // 1. Fetch Monclova
        const monclovaRes = await fetch(monclovaUrl, { cache: 'no-store' });
        const monclovaCsvText = await monclovaRes.text();
        const monclovaParsed = Papa.parse(monclovaCsvText, { header: false });
        const monclovaRows = monclovaParsed.data as string[][];

        // Encontrar la fila de fechas de Monclova
        const monclovaDateRow = monclovaRows.find(r => r[0] && (r[0].includes('/') || r[0].includes('-')) && r[4]);
        const monclovaWeekStart = monclovaDateRow ? monclovaDateRow[4].trim() : '2026-06-29'; // e.g. '2026-06-29'

        // Mapear días y columnas de Monclova
        const monclovaDays = [
            { label: 'Lunes', nameCol: 4, optsCol: 5 },
            { label: 'Martes', nameCol: 6, optsCol: 7 },
            { label: 'Miércoles', nameCol: 8, optsCol: 9 },
            { label: 'Jueves', nameCol: 10, optsCol: 11 },
            { label: 'Viernes', nameCol: 12, optsCol: 13 },
            { label: 'Viernes 3er Turno', nameCol: 14, optsCol: 15 }
        ];

        const monclovaDishesByDay: Record<string, any[]> = {};
        monclovaDays.forEach(d => {
            monclovaDishesByDay[d.label] = [];
        });

        let monclovaSideCount = 0;
        monclovaRows.forEach((row, idx) => {
            if (idx < 3) return;
            const csvCategory = row[1]?.trim().toLowerCase();
            if (!csvCategory) return;

            let targetType = '';
            if (csvCategory === 'main') targetType = 'plato_fuerte';
            else if (csvCategory === 'antojito') targetType = 'antojito';
            else if (csvCategory === 'side') {
                monclovaSideCount++;
                targetType = monclovaSideCount <= 1 ? 'guarnicion_1' : 'guarnicion_2';
            }
            else if (csvCategory === 'soup') targetType = 'sopa_ensalada';
            else if (csvCategory === 'dessert') targetType = 'postre';

            if (!targetType) return;

            monclovaDays.forEach(d => {
                const dishName = row[d.nameCol]?.trim() || '-';
                const alternativesStr = row[d.optsCol]?.trim() || '';
                const alternatives = alternativesStr.split(',').map(s => s.trim()).filter(Boolean);

                monclovaDishesByDay[d.label].push({
                    id: `tradicional-${monclovaWeekStart}-${d.label.toLowerCase()}-${targetType}`,
                    type: targetType,
                    name: dishName,
                    originalName: dishName,
                    alternatives: alternatives,
                    proteinType: detectProtein(dishName) || null
                });
            });
        });

        // 2. Fetch Tijuana
        const tijuanaRes = await fetch(tijuanaUrl, { cache: 'no-store' });
        const tijuanaCsvText = await tijuanaRes.text();
        const tijuanaParsed = Papa.parse(tijuanaCsvText, { header: false });
        const tijuanaRows = tijuanaParsed.data as string[][];

        // Encontrar la fila de fechas de Tijuana
        const tijuanaDateRow = tijuanaRows.find(r => r[0] && (r[0].includes('/') || r[0].includes('-')) && r[2]);
        let tijuanaWeekStartRaw = tijuanaDateRow ? tijuanaDateRow[0].trim() : '06/29/2026';
        
        // Mapear MM/DD/YYYY a YYYY-MM-DD
        let tijuanaWeekStart = '2026-06-29';
        const parts = tijuanaWeekStartRaw.split('/');
        if (parts.length === 3) {
            const m = parts[0].padStart(2, '0');
            const d = parts[1].padStart(2, '0');
            const y = parts[2];
            tijuanaWeekStart = `${y}-${m}-${d}`;
        }

        // Mapear días y columnas de Tijuana
        const tijuanaDays = [
            { label: 'Lunes', nameCol: 2, optsCol: 3 },
            { label: 'Martes', nameCol: 4, optsCol: 5 },
            { label: 'Miércoles', nameCol: 6, optsCol: 7 },
            { label: 'Jueves', nameCol: 8, optsCol: 9 },
            { label: 'Viernes', nameCol: 10, optsCol: 11 }
        ];

        const tijuanaDishesByDay: Record<string, any[]> = {};
        tijuanaDays.forEach(d => {
            tijuanaDishesByDay[d.label] = [];
        });

        let tijuanaBreakfastCount = 0;
        let tijuanaGuarnicionCount = 0;

        tijuanaRows.forEach((row, idx) => {
            if (idx < 3) return;
            const csvCategory = row[1]?.trim().toLowerCase();
            if (!csvCategory) return;

            let targetType = '';
            if (csvCategory === 'desayuno') {
                tijuanaBreakfastCount++;
                targetType = `desayuno_${tijuanaBreakfastCount}`;
            }
            else if (csvCategory === 'bebida caliente') targetType = 'bebida_caliente';
            else if (csvCategory === 'barra_de_frutas') targetType = 'barra_de_frutas';
            else if (csvCategory === 'platillo_especial') targetType = 'platillo_especial';
            else if (csvCategory === 'plato_fuente') targetType = 'plato_fuerte';
            else if (csvCategory === 'plato_fuerte') targetType = 'plato_fuerte_2';
            else if (csvCategory === 'antojito') targetType = 'antojito';
            else if (csvCategory === 'guarnicion') {
                tijuanaGuarnicionCount++;
                targetType = `guarnicion_${tijuanaGuarnicionCount}`;
            }
            else if (csvCategory === 'barra_de_ensaladas') targetType = 'barra_de_ensaladas';
            else if (csvCategory === 'sopa_ensalada') targetType = 'sopa_ensalada';
            else if (csvCategory === 'postre') targetType = 'postre';

            if (!targetType) return;

            tijuanaDays.forEach(d => {
                const dishName = row[d.nameCol]?.trim() || '-';
                const alternativesStr = row[d.optsCol]?.trim() || '';
                const alternatives = alternativesStr.split(',').map(s => s.trim()).filter(Boolean);

                tijuanaDishesByDay[d.label].push({
                    id: `tradicional-${tijuanaWeekStart}-${d.label.toLowerCase()}-${targetType}`,
                    type: targetType,
                    name: dishName,
                    originalName: dishName,
                    alternatives: alternatives,
                    proteinType: detectProtein(dishName) || null
                });
            });
        });

        // Completar categorías faltantes en Tijuana (como bebida)
        const tijuanaCategories = [
            'desayuno_1', 'desayuno_2', 'desayuno_3', 'desayuno_4', 'bebida_caliente', 
            'barra_de_frutas', 'platillo_especial', 'plato_fuerte', 'plato_fuerte_2', 
            'antojito', 'guarnicion_1', 'guarnicion_2', 'barra_de_ensaladas', 
            'sopa_ensalada', 'postre', 'bebida'
        ];

        tijuanaDays.forEach(d => {
            tijuanaCategories.forEach(cat => {
                const exists = tijuanaDishesByDay[d.label].some(dish => dish.type === cat);
                if (!exists) {
                    tijuanaDishesByDay[d.label].push({
                        id: `tradicional-${tijuanaWeekStart}-${d.label.toLowerCase()}-${cat}`,
                        type: cat,
                        name: '-',
                        originalName: '-',
                        alternatives: [],
                        proteinType: null
                    });
                }
            });
        });

        // 3. Guardar en Firestore (Monclova)
        const monclovaDates = getWeekDates(monclovaWeekStart, monclovaDays.length);
        const monclovaMenuPayload = monclovaDays.map((d, dayIdx) => {
            const dateInfo = monclovaDates[dayIdx] || { date: '', fullDate: '' };
            return {
                day: d.label,
                date: d.label === 'Viernes 3er Turno' ? monclovaDates[4]?.date || '' : dateInfo.date,
                dishes: monclovaDishesByDay[d.label]
            };
        });

        const monclovaExpirationDate = `${monclovaWeekStart}T18:00`;

        await setDoc(doc(db, 'menus', `monclova_${monclovaWeekStart}`), {
            plantId: 'monclova',
            weekStartDate: monclovaWeekStart,
            status: 'published',
            expirationDate: monclovaExpirationDate,
            updatedAt: new Date().toISOString(),
            bars: {
                tradicional: {
                    menu: monclovaMenuPayload
                }
            }
        });

        // 4. Guardar en Firestore (Tijuana)
        const tijuanaDates = getWeekDates(tijuanaWeekStart, tijuanaDays.length);
        const tijuanaMenuPayload = tijuanaDays.map((d, dayIdx) => {
            const dateInfo = tijuanaDates[dayIdx] || { date: '', fullDate: '' };
            return {
                day: d.label,
                date: dateInfo.date,
                dishes: tijuanaDishesByDay[d.label]
            };
        });

        const tijuanaExpirationDate = `${tijuanaWeekStart}T18:00`;

        await setDoc(doc(db, 'menus', `tijuana_${tijuanaWeekStart}`), {
            plantId: 'tijuana',
            weekStartDate: tijuanaWeekStart,
            status: 'published',
            expirationDate: tijuanaExpirationDate,
            updatedAt: new Date().toISOString(),
            bars: {
                tradicional: {
                    menu: tijuanaMenuPayload
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Migración de menús de Monclova y Tijuana realizada con éxito a Firestore.',
            monclova: {
                weekStartDate: monclovaWeekStart,
                daysCount: monclovaMenuPayload.length
            },
            tijuana: {
                weekStartDate: tijuanaWeekStart,
                daysCount: tijuanaMenuPayload.length
            }
        });
    } catch (e: any) {
        console.error('Error durante migración:', e);
        return NextResponse.json({
            success: false,
            error: e.message || 'Error desconocido'
        }, { status: 500 });
    }
}
