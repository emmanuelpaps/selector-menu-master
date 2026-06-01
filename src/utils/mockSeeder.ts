import { PLANTS } from '../config/plants';
import { STANDARD_CATEGORIES } from '../data/menu';

export const seedMockData = () => {
    if (typeof window === 'undefined') return;

    // Solo sembrar si no está inicializado
    if (localStorage.getItem('ave_mock_initialized') === 'true') return;

    console.log("Sembrando datos mock locales en localStorage para pruebas de navegación...");

    const targetWeeks = ['2026-06-01', '2026-06-08'];

    Object.values(PLANTS).forEach(plant => {
        targetWeeks.forEach((weekStartDate) => {
            const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            if (plant.id === 'monclova') days.push('Viernes 3er Turno');
            if (plant.id === 'jabil_cuu') days.push('Sábado', 'Domingo');

            const activeBars = plant.isMultiBar && plant.barsConfig 
                ? plant.barsConfig 
                : [{ id: 'tradicional', label: 'Tradicional', categories: plant.categories || STANDARD_CATEGORIES }];

            const barsPayload: Record<string, any> = {};
            const menuData: Record<string, any> = {};

            activeBars.forEach(bar => {
                menuData[bar.id] = {};
                
                barsPayload[bar.id] = {
                    menu: days.map((dayLabel, dayIdx) => {
                        const dateNum = dayIdx + 1;
                        const dateStr = dateNum < 10 ? `0${dateNum}` : `${dateNum}`;
                        const displayDate = `${dateStr}/06`;

                        // Inicializar el mapeo de menuData para cargar en la cuadrícula editable del CMS
                        menuData[bar.id][dayIdx] = {};

                        return {
                            day: dayLabel,
                            date: displayDate,
                            dishes: bar.categories.map(catKey => {
                                // Nombres mock elegantes y acordes a la categoría
                                let name = '';
                                let alternatives: string[] = [];
                                let proteinType: 'pollo' | 'res' | 'puerco' | 'marisco' | null = null;

                                if (catKey.includes('desayuno')) {
                                    const options = [
                                        'Chilaquiles rojos con huevo',
                                        'Huevo revuelto con jamón',
                                        'Burrito de deshebrada con papa',
                                        'Omelette de claras con espinaca',
                                        'Molletes tradicionales con queso'
                                    ];
                                    name = options[dayIdx % options.length];
                                    alternatives = ['Huevo al gusto', 'Fruta de temporada con yogurt'];
                                } else if (catKey.includes('plato') || catKey.includes('guisado') || catKey.includes('fuerte') || catKey.includes('proteina') || catKey.includes('grill')) {
                                    const options = [
                                        { n: 'Milanesa de pollo crujiente', p: 'pollo' as const },
                                        { n: 'Bistec ranchero con nopales', p: 'res' as const },
                                        { n: 'Costillitas de puerco en salsa verde', p: 'puerco' as const },
                                        { n: 'Filete de pescado al mojo de ajo', p: 'marisco' as const },
                                        { n: 'Pechuga de pollo a la plancha', p: 'pollo' as const }
                                    ];
                                    const opt = options[dayIdx % options.length];
                                    name = opt.n;
                                    proteinType = opt.p;
                                    alternatives = ['Guisado de res del día', 'Enchiladas suizas de pollo'];
                                } else if (catKey.includes('sopa') || catKey.includes('caldo')) {
                                    const options = ['Sopa de fideo', 'Crema de elote', 'Caldo tlalpeño', 'Consomé de pollo', 'Sopa de verduras'];
                                    name = options[dayIdx % options.length];
                                    alternatives = ['Sopa fría de coditos'];
                                } else if (catKey.includes('guarnicion')) {
                                    const options = ['Arroz rojo', 'Frijoles refritos', 'Puré de papa', 'Verduras al vapor', 'Papas gajo crujientes'];
                                    name = options[(dayIdx + (catKey.includes('2') ? 1 : 0)) % options.length];
                                    alternatives = ['Frijoles charros'];
                                } else if (catKey.includes('postre')) {
                                    const options = ['Flan napolitano', 'Gelatina mosaico', 'Arroz con leche', 'Duraznos en almíbar', 'Pay de limón'];
                                    name = options[dayIdx % options.length];
                                    alternatives = ['Manzana fresca'];
                                } else if (catKey.includes('ensalada')) {
                                    const options = ['Ensalada césar', 'Ensalada mixta con aderezo', 'Barra de ensaladas fresca', 'Ensalada de espinacas', 'Ensalada de manzana'];
                                    name = options[dayIdx % options.length];
                                    alternatives = ['Aderezo ranch extra'];
                                } else if (catKey.includes('bebida')) {
                                    const options = ['Agua de horchata', 'Agua de Jamaica', 'Té helado de limón', 'Agua de limón con chía', 'Agua de melón'];
                                    name = options[dayIdx % options.length];
                                    alternatives = ['Agua purificada'];
                                } else if (catKey.includes('burrito')) {
                                    const options = ['Burrito de deshebrada', 'Burrito de frijoles con queso', 'Burrito de chicharrón prensado', 'Burrito de picadillo', 'Burrito de asado'];
                                    name = options[dayIdx % options.length];
                                    alternatives = ['Salsa roja picante', 'Salsa verde tatemada'];
                                } else {
                                    name = `Platillo especial del ${dayLabel}`;
                                    alternatives = [`Opción alternativa A`, `Opción alternativa B`];
                                }

                                // Llenar el formulario editable del CMS
                                menuData[bar.id][dayIdx][catKey] = {
                                    name,
                                    alternatives
                                };

                                return {
                                    id: `${bar.id}-${weekStartDate}-${dayLabel.toLowerCase()}-${catKey}`,
                                    type: catKey,
                                    name: name,
                                    alternatives: alternatives,
                                    proteinType: proteinType || null
                                };
                            })
                        };
                    })
                };
            });

            // Guardar el menú publicado en localStorage
            const mockKey = `mock_menu_${plant.id}_${weekStartDate}`;
            localStorage.setItem(mockKey, JSON.stringify({
                plantId: plant.id,
                weekStartDate,
                status: 'published',
                expirationDate: `${weekStartDate}T18:00`,
                updatedAt: new Date().toISOString(),
                bars: barsPayload,
                menuData
            }));
        });
    });

    // Sembrar algunas aprobaciones iniciales realistas
    const initialApprovals = [
        {
            id: 'mock-approval-1',
            plantId: 'monclova',
            plantName: 'Monclova, Coah.',
            weekStartDate: '2026-06-01',
            approvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            approvedBy: 'Ing. Carlos Mendoza',
            role: 'Gerente de Planta (Aptiv)',
            modifiedDishesCount: 1
        },
        {
            id: 'mock-approval-2',
            plantId: 'tijuana',
            plantName: 'Tijuana, BC',
            weekStartDate: '2026-06-01',
            approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            approvedBy: 'Lic. Laura Flores',
            role: 'Administradora de Maquila',
            modifiedDishesCount: 0
        },
        {
            id: 'mock-approval-3',
            plantId: 'jabil_cuu',
            plantName: 'Chihuahua, Chih. (Jabil)',
            weekStartDate: '2026-06-01',
            approvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            approvedBy: 'Ing. Fernando Ruiz',
            role: 'Comité de Comedor Jabil',
            modifiedDishesCount: 3
        }
    ];

    localStorage.setItem('mock_approvals', JSON.stringify(initialApprovals));
    localStorage.setItem('ave_mock_initialized', 'true');
    
    // Auto loguear al admin para mayor conveniencia en modo local
    localStorage.setItem('ave_mock_logged_in', 'true');

    console.log("¡Datos mock locales sembrados exitosamente!");
};
