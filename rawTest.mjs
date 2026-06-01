import Papa from 'papaparse';

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSG_-vs7Y2natNJlD9xzn0o1gRDTgpLLNWPNGC3g9qi85JIox2rj4kTAvx3r2aTK45DslfzAk_7eRy4/pub?gid=344725499&single=true&output=csv';

async function test() {
    const response = await fetch(url);
    const csvData = await response.text();

    import('papaparse').then(Papa => {
        Papa.default.parse(csvData, {
            header: false,
            complete: (results) => {
                const rawData = results.data;
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(5, rawData.length); i++) {
                    if (rawData[i].includes('Category') || rawData[i].includes('T_Category')) {
                        headerRowIndex = i;
                        break;
                    }
                }
                const headers = rawData[headerRowIndex];
                const data = [];
                for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                    const row = {};
                    headers.forEach((header, colIdx) => {
                        if (header) row[header.trim()] = rawData[i][colIdx];
                    });
                    data.push(row);
                }
                const weekRows = data.filter(r => r.Category?.startsWith('SEMANA'));
                console.log("Extracted Week Dates:");
                weekRows.forEach(r => {
                    console.log(`${r.Category}: Master=${r['Monday Date']}, T=${r['T_Monday Date']}, G=${r['G_Monday Date']}, L=${r['L_Monday Date']}`);
                });
            }
        });
    });
}
test();
