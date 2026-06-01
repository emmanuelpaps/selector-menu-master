import { DayMenu } from '../data/menu';

export const exportMenuToCSV = (menu: DayMenu[], plantName: string, weekRange: string, barLabel?: string) => {
    // Definir los encabezados basados en los días disponibles en el menú
    const days = menu.map(m => m.day);
    
    // Encabezado del CSV
    const headers = ['Category', ...days.flatMap(day => [`${day} Nombre`, `${day} Opciones`])];
    
    // Agrupar los platillos por categoría (type)
    const categoryMap: Record<string, Record<string, { name: string; options: string[] }>> = {};
    
    menu.forEach(dayMenu => {
        dayMenu.dishes.forEach(dish => {
            if (!categoryMap[dish.type]) {
                categoryMap[dish.type] = {};
            }
            categoryMap[dish.type][dayMenu.day] = {
                name: dish.name || '',
                options: dish.alternatives || []
            };
        });
    });
    
    // Crear las filas del CSV
    const rows = Object.keys(categoryMap).map(categoryKey => {
        const rowData = [categoryKey];
        days.forEach(day => {
            const item = categoryMap[categoryKey][day];
            if (item) {
                rowData.push(item.name.replace(/"/g, '""')); // Escapar comillas dobles
                rowData.push(item.options.join(', ').replace(/"/g, '""'));
            } else {
                rowData.push('-');
                rowData.push('');
            }
        });
        return rowData;
    });
    
    // Construir contenido CSV
    const csvContent = [
        [`# PLANTA: ${plantName.toUpperCase()}`, `# SEMANA: ${weekRange.toUpperCase()}`, barLabel ? `# BARRA: ${barLabel.toUpperCase()}` : ''],
        [], // Fila en blanco
        headers,
        ...rows
    ].map(row => row.map(cell => {
        // Envolver celdas que contienen comas o saltos de línea con comillas
        if (cell && (cell.includes(',') || cell.includes('\n') || cell.includes('"') || cell.startsWith('#'))) {
            return `"${cell}"`;
        }
        return cell;
    }).join(',')).join('\n');
    
    // Crear elemento de descarga
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM UTF-8 para Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const cleanFileName = `Menu_${plantName.replace(/\s+/g, '_')}_${weekRange.replace(/\s+/g, '_')}${barLabel ? `_${barLabel}` : ''}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', cleanFileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
