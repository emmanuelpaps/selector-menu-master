import Papa from 'papaparse';
import fetch from 'node-fetch';

const PLANTS = {
    juarez: {
        id: 'juarez',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVKjuyjKt86Sl8v77xjm1Q1Akg3v_kFh5K0l1eJDAv5sanXyxGEC7amU58B3FltXJ2KXABZtu-x9do/pub?gid=0&single=true&output=csv',
        isMultiBar: true
    }
};

const fixSpelling = (text) => {
    if (!text) return text;
    let cleaned = text.trim().replace(/(?:^|\s)[-*•+]\s*/g, ' • ').trim();
    cleaned = cleaned.toLowerCase().replace(/\s+/g, ' ');
    // Simplified just to test parsing!
    return cleaned;
};

async function test() {
    const csvData = await (await fetch(PLANTS.juarez.sheetUrl)).text();
    Papa.parse(csvData, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
            const rawData = results.data;
            if (rawData.length === 0) return;

            let headerRowIndex = 0;
            for (let i = 0; i < Math.min(5, rawData.length); i++) {
                if (rawData[i].includes('Category') || rawData[i].includes('B_Category') || rawData[i].includes('D_Category')) {
                    headerRowIndex = i;
                    break;
                }
            }

            const headers = rawData[headerRowIndex];
            const data = [];
            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = {};
                headers.forEach((header, colIdx) => {
                    if (header) {
                        row[header.trim()] = rawData[i][colIdx];
                    }
                });
                data.push(row);
            }

            const barsMap = { desayuno: {}, tradicional: {}, show: {}, variedad: {}, burritos: {} };
            const prefixes = { D_: 'desayuno', T_: 'tradicional', S_: 'show', V_: 'variedad', B_: 'burritos' };
            const lastSeenDates = { D_: '', T_: '', S_: '', V_: '', B_: '' };

            let days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

            data.forEach((row) => {
                Object.entries(prefixes).forEach(([prefix, barId]) => {
                    const categoryKey = `${prefix}Category`;
                    const dateKey = `${prefix}Date`;
                    const category = (row[categoryKey] || row[prefix + 'Category'])?.toLowerCase().trim();
                    let currentMondayDate = (row[dateKey] || row[prefix + 'Monday Date'] || row[prefix + 'Monday_Date'])?.toString().trim();

                    if (!currentMondayDate) {
                        currentMondayDate = (row['Monday Date'] || row['Monday_Date'])?.toString().trim();
                    }

                    if (currentMondayDate) {
                        currentMondayDate = currentMondayDate.replace(/\//g, '-');
                        lastSeenDates[prefix] = currentMondayDate;
                    } else {
                        currentMondayDate = lastSeenDates[prefix];
                    }

                    if (!currentMondayDate || !category) return;

                    if (!barsMap[barId][currentMondayDate]) {
                        barsMap[barId][currentMondayDate] = { mondayDate: currentMondayDate, menu: days.map(day => ({ day, dishes: [] })) };
                    }

                    days.forEach((day, idx) => {
                        const dayHeader = day === 'Miércoles' ? (row[`${prefix}Miércoles Nombre`] || row[`${prefix}Miercoles Nombre`] ? 'Miércoles' : 'Miercoles') : day;
                        const nameKey = `${prefix}${dayHeader} Nombre`;
                        if (row[nameKey]) {
                            barsMap[barId][currentMondayDate].menu[idx].dishes.push({ name: fixSpelling(row[nameKey]) });
                        }
                    });
                });
            });

            console.log("Tradicional dates:", Object.keys(barsMap['tradicional']));
            if (Object.keys(barsMap['tradicional']).length > 0) {
                const date = Object.keys(barsMap['tradicional'])[0];
                console.log("Lunes dishes:", barsMap['tradicional'][date].menu[0].dishes.length);
            }
        }
    });
}
test();
