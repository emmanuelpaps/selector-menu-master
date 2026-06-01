import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeeklyMenu } from '../data/menu';
import { JUAREZ_BARS, BarType, CATEGORY_LABELS, STANDARD_CATEGORIES } from '../data/menu';
import { safeDateParse } from '../utils/dateUtils';
import { PLANTS } from '../config/plants';

const loadImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
        if (!url) {
            resolve(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error('Failed to load image for PDF:', url);
            resolve(null);
        };
        img.src = url;
    });
};

export const generatePDF = async (
    allBars: Record<BarType, WeeklyMenu[]> | WeeklyMenu[], // Can beJuarez object or regular array
    userName: string,
    userRole: string,
    logoAve: string,
    secondaryLogo: string,
    plantName: string,
    companyName: string,
    modifiedDishes: Set<string> = new Set()
) => {
    const DocClass = (jsPDF as any).jsPDF || jsPDF;
    const doc = new DocClass('l', 'mm', 'a4');
    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
    const activePlant = Object.values(PLANTS as Record<string, any>).find(p => p.name.toUpperCase() === plantName.toUpperCase()) || PLANTS.monclova;
    const isMultiBar = activePlant?.isMultiBar;

    // Preload logos
    const loadedLogoAve = await loadImage(logoAve);
    const loadedSecondaryLogo = await loadImage(secondaryLogo);

    const addImageSafe = (imgElement: HTMLImageElement | null, x: number, y: number, w: number, h: number) => {
        try {
            if (imgElement) {
                doc.addImage(imgElement, 'PNG', x, y, w, h, undefined, 'FAST');
            }
        } catch (e) {
            console.error('Error adding image to PDF:', e);
        }
    };

    const renderHeader = (doc: any, title: string, subtitle: string, range: string, weekLabel: string) => {
        const headerColorCode = activePlant?.themeColor || [27, 54, 93];

        doc.setFillColor(...headerColorCode); // Dynamic theme color or fallback to ave-navy
        doc.rect(0, 0, 297, 45, 'F');
        addImageSafe(loadedLogoAve, 12, 12, 45, 12);
        if (secondaryLogo) {
            if (activePlant?.id === 'jabil_cuu') {
                // Jabil's actual cropped logo ratio is ~ 6.1:1. Center it nicely.
                addImageSafe(loadedSecondaryLogo, 235, 18, 45, 7.4);
            } else {
                addImageSafe(loadedSecondaryLogo, 240, 15, 40, 10);
            }
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(weekLabel, 12, 40);

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 148.5, 22, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 148.5, 33, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(range, 148.5, 41, { align: 'center' });
    };

    const renderSignatureBlock = (doc: any, y: number) => {
        const startY = Math.min(y + 15, 165);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);

        // Line for signature
        doc.line(15, startY + 20, 115, startY + 20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('FIRMA DE CONFORMIDAD', 15, startY + 25);

        // Signer data
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(userName.toUpperCase(), 15, startY + 18);
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(userRole.toUpperCase(), 15, startY + 29);

        // Right side info
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DE VALIDACIÓN', 180, startY + 25);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Empresa: ${companyName.toUpperCase()}`, 180, startY + 30);
        doc.text(`Aprobado el: ${timestamp}`, 180, startY + 35);
        doc.text(`Planta: ${plantName.toUpperCase()}`, 180, startY + 40);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Este documento confirma la aprobación oficial del menú institucional.', 148.5, 202, { align: 'center' });
    };

    // Determine how many weeks to process
    let weekCount = 0;
    const barsData = allBars as Record<string, WeeklyMenu[]>;
    if (isMultiBar && !Array.isArray(allBars) && activePlant.barsConfig) {
        weekCount = barsData[activePlant.barsConfig[0].id]?.length || 0;
    } else if (Array.isArray(allBars)) {
        weekCount = allBars.length;
    }

    for (let i = 0; i < weekCount; i++) {
        if (i > 0) doc.addPage('l', 'mm', 'a4');

        let currentMondayDate = "";
        if (isMultiBar && !Array.isArray(allBars) && activePlant.barsConfig) {
            currentMondayDate = barsData[activePlant.barsConfig[0].id]?.[i]?.mondayDate || "";
        } else if (Array.isArray(allBars)) {
            currentMondayDate = allBars[i].mondayDate;
        }

        const weekData = Array.isArray(allBars) ? allBars[i] : null;

        const d_start = safeDateParse(currentMondayDate);
        if (isNaN(d_start.getTime())) {
            console.error("Invalid date in PDF generation:", currentMondayDate);
            continue;
        }

        const d_end = addDays(d_start, plantName.toLowerCase().includes('jabil') ? 6 : 4);
        const dateRange = `CALENDARIO DE MENÚ: DEL ${format(d_start, 'd')} AL ${format(d_end, 'd')} DE ${format(d_end, 'MMMM', { locale: es }).toUpperCase()} DE ${format(d_end, 'yyyy')}`;
        const weekLabel = `SEMANA ${i + 1} DE ${weekCount}`;

        renderHeader(doc, 'REPORTE DE APROBACIÓN DE MENÚ', plantName.toUpperCase(), dateRange.toUpperCase(), weekLabel);

        if (isMultiBar && !Array.isArray(allBars) && activePlant.barsConfig) {
            let currentY = 55;
            activePlant.barsConfig.forEach((barConfig: any) => {
                const barWeeks = barsData[barConfig.id];
                const weekData = barWeeks[i];
                if (!weekData) return;

                const hexToRgb = (hex: string): [number, number, number] => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return [r, g, b];
                };

                const rgbColor = hexToRgb(barConfig.color);

                const body = (barConfig.categories as string[]).map((catKey: string) => {
                    const row: any[] = [CATEGORY_LABELS[catKey]?.toUpperCase() || catKey.toUpperCase()];
                    weekData.menu.forEach((day: any) => {
                        const dish = day.dishes.find((d: any) => d.type === catKey);
                        if (dish) {
                            const isMod = modifiedDishes.has(dish.id);
                            row.push({ 
                                content: dish.name, 
                                proteinType: dish.proteinType,
                                styles: isMod ? { fontStyle: 'bold', textColor: [27, 54, 93], fillColor: [240, 248, 255] } : undefined
                            });
                        } else {
                            row.push('-');
                        }
                    });
                    return row;
                });

                const headRow = [barConfig.label.toUpperCase(), 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
                if (plantName.toLowerCase().includes('jabil')) {
                    headRow.push('SÁBADO', 'DOMINGO');
                }

                autoTable(doc, {
                    startY: currentY,
                    head: [headRow],
                    body: body,
                    theme: 'grid',
                    headStyles: {
                        fillColor: rgbColor,
                        lineColor: [255, 255, 255],
                        lineWidth: 0.2,
                        halign: 'center',
                        fontSize: 8,
                        cellPadding: 2
                    },
                    styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
                    columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 30 } },
                    margin: { left: 15, right: 15 },
                    pageBreak: 'auto',
                    didDrawCell: (data: any) => {
                        if (data.column.index === 0) return;
                        const pType = data.cell.raw?.proteinType;
                        if (pType) {
                            let hex = '#FFFFFF';
                            if (pType === 'pollo') hex = '#FACC15';
                            else if (pType === 'res') hex = '#EF4444';
                            else if (pType === 'puerco') hex = '#F472B6';
                            else if (pType === 'marisco') hex = '#38BDF8';
                            doc.setFillColor(hex);
                            doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, 'F');
                        }
                    }
                });

                currentY = (doc as any).lastAutoTable.finalY + 8;
            });
            renderSignatureBlock(doc, (doc as any).lastAutoTable.finalY);
        } else if (Array.isArray(allBars)) {
            const weekData = allBars[i];

            // Find categories for this plant
            const catKeys = (activePlant?.categories as string[]) || STANDARD_CATEGORIES;

            const body = catKeys.map((key: string) => {
                const row: any[] = [CATEGORY_LABELS[key]?.toUpperCase() || key.toUpperCase()];
                weekData.menu.forEach(day => {
                    const dish = day.dishes.find(d => d.type === key);
                    if (dish) {
                        const isMod = modifiedDishes.has(dish.id);
                        // @ts-ignore
                        row.push({ 
                            content: dish.name, 
                            proteinType: dish.proteinType,
                            styles: isMod ? { fontStyle: 'bold', textColor: [27, 54, 93], fillColor: [240, 248, 255] } : undefined
                        });
                    } else {
                        row.push('-');
                    }
                });
                return row;
            });

            const isMonclova = plantName.toLowerCase().includes('monclova');
            const tableHeaders = ['CATEGORÍA', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
            if (isMonclova) {
                tableHeaders.push('VIERNES\n3ER TURNO');
            }

            const headerColorCode = activePlant?.themeColor || [27, 54, 93];

            autoTable(doc, {
                startY: 55,
                head: [tableHeaders],
                body: body,
                theme: 'grid',
                headStyles: { fillColor: headerColorCode, halign: 'center', fontSize: 8 },
                styles: { fontSize: 7, cellPadding: 2.5 },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: isMonclova ? 26 : 35 } },
                didDrawCell: (data: any) => {
                    if (data.column.index === 0) return;
                    const pType = data.cell.raw?.proteinType;
                    if (pType) {
                        let hex = '#FFFFFF';
                        if (pType === 'pollo') hex = '#FACC15';
                        else if (pType === 'res') hex = '#EF4444';
                        else if (pType === 'puerco') hex = '#F472B6';
                        else if (pType === 'marisco') hex = '#38BDF8';
                        doc.setFillColor(hex);
                        doc.rect(data.cell.x, data.cell.y, 2, data.cell.height, 'F');
                    }
                }
            });
            renderSignatureBlock(doc, (doc as any).lastAutoTable.finalY);
        }
    }

    // Generate descriptive filename using the first week's dates
    let fileName = `Reporte_Aprobado_${plantName.replace(/\s+/g, '_')}_${format(new Date(), 'dd_MM_yyyy')}.pdf`;

    try {
        const firstWeek = isMultiBar && !Array.isArray(allBars) && activePlant.barsConfig ? barsData[activePlant.barsConfig[0].id]?.[0] : (Array.isArray(allBars) ? allBars[0] : null);
        const lastWeek = isMultiBar && !Array.isArray(allBars) && activePlant.barsConfig ? barsData[activePlant.barsConfig[0].id]?.[weekCount - 1] : (Array.isArray(allBars) ? allBars[weekCount - 1] : null);

        if (firstWeek && lastWeek) {
            const d_start = safeDateParse(firstWeek.mondayDate);
            const l_start = safeDateParse(lastWeek.mondayDate);

            if (!isNaN(d_start.getTime()) && !isNaN(l_start.getTime())) {
                // Calculate end day of the FINAL week
                const d_end = addDays(l_start, plantName.toLowerCase().includes('jabil') ? 6 : 4);
                
                const startDay = format(d_start, 'dd');
                const startMonth = format(d_start, 'MMM', { locale: es }).replace('.', '');
                
                const endDay = format(d_end, 'dd');
                const endMonth = format(d_end, 'MMM', { locale: es }).replace('.', '');
                
                const cleanPlant = plantName.split(',')[0].replace(/\s+/g, '_');
                
                if (startMonth === endMonth) {
                    fileName = `Menu_${cleanPlant}_${startDay}_al_${endDay}_${startMonth}.pdf`;
                } else {
                    fileName = `Menu_${cleanPlant}_${startDay}_${startMonth}_al_${endDay}_${endMonth}.pdf`;
                }
            }
        }
    } catch (e) {
        console.error("Error generating filename:", e);
    }

    doc.save(fileName);
    return fileName;
};
