import fs from 'fs';
import { parse } from 'csv-parse/sync';

const rawCsv = fs.readFileSync('plantilla_exacta_jabil.csv', 'utf8');

const parseResult = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true
});

const activePlant = {
    csvPrefixes: {
        'T_': 'tradicional',
        'G_': 'grill',
        'L_': 'light'
    }
};

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const barsMap = {};
const lastSeenDates = {};
Object.keys(activePlant.csvPrefixes).forEach(prefix => {
    barsMap[activePlant.csvPrefixes[prefix]] = {};
    lastSeenDates[prefix] = '';
});

parseResult.forEach(row => {
    Object.entries(activePlant.csvPrefixes).forEach(([prefix, barId]) => {
        const categoryKey = `${prefix}Category`;
        const dateKey = `${prefix}Monday Date`;
        const category = (row[categoryKey])?.toLowerCase().trim().replace(/\s+/g, '_');
        let currentMondayDate = row[dateKey]?.toString().trim();

        if (!currentMondayDate) {
            currentMondayDate = row['Monday Date']?.toString().trim();
        }

        if (currentMondayDate) {
            currentMondayDate = currentMondayDate.replace(/\//g, '-');
            lastSeenDates[prefix] = currentMondayDate;
        } else {
            currentMondayDate = lastSeenDates[prefix];
        }

        if (!currentMondayDate || !category) return;

        if (!barsMap[barId]) barsMap[barId] = {};
        if (!barsMap[barId][currentMondayDate]) {
            barsMap[barId][currentMondayDate] = { mondayDate: currentMondayDate, names: [] };
        }

        barsMap[barId][currentMondayDate].names.push(category);
    });
});

console.log("Light categories for week 1:");
console.log(barsMap['light']['2026-03-30']?.names);

