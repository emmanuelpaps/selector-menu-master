import { BarConfig, JABIL_BARS, JUAREZ_BARS } from '../data/menu';

export interface PlantConfig {
    id: string;
    name: string;
    location: string;
    sheetUrl: string;
    whatsappNumber: string;
    contactEmail: string;
    companyName: string;
    logoAptivEnabled: boolean;
    logoJabilEnabled?: boolean;
    whatsappMessagePrefix: string;
    categories?: string[];
    themeColor?: [number, number, number]; // RGB array for custom PDF color
    isMultiBar?: boolean;
    barsConfig?: BarConfig[];
    csvPrefixes?: Record<string, string>;
}

export const PLANTS: Record<string, PlantConfig> = {
    monclova: {
        id: 'monclova',
        name: 'Monclova, Coah.',
        location: 'Monclova, Coahuila',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmNuCVTxzyTIaJivjoIpBNnleClKEeLjowfx-sWgPp0tuncPpExaBdikFmw9CvIrtN9mX4fGv2d3lw/pub?gid=0&single=true&output=csv',
        whatsappNumber: '5216563237998',
        contactEmail: 'contacto@gpoave.com',
        companyName: 'GRUPO AVE & APTIV',
        logoAptivEnabled: true,
        whatsappMessagePrefix: 'REPORTE DE APROBACIÓN - MONCLOVA',
        categories: [
            'plato_fuerte',
            'antojito',
            'guarnicion_1',
            'guarnicion_2',
            'sopa_ensalada',
            'postre'
        ]
    },
    tijuana: {
        id: 'tijuana',
        name: 'Tijuana, BC',
        location: 'Tijuana, Baja California Norte',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt3Bbk5WY9txPbzWEl3Hf4ijY6V1tTw0M49l-_VJaZC_1qcTsyQ_-h77O0DTvQv7PNnzNjpgV4xEZ0/pub?gid=0&single=true&output=csv',
        whatsappNumber: '5216563237998',
        contactEmail: 'contacto@gpoave.com',
        companyName: 'GRUPO AVE & APTIV (TIJUANA)',
        logoAptivEnabled: true,
        whatsappMessagePrefix: 'REPORTE DE APROBACIÓN - TIJUANA',
        categories: [
            'desayuno_1',
            'desayuno_2',
            'desayuno_3',
            'desayuno_4',
            'bebida_caliente',
            'barra_de_frutas',
            'platillo_especial',
            'plato_fuerte',
            'plato_fuerte_2',
            'antojito',
            'guarnicion_1',
            'guarnicion_2',
            'barra_de_ensaladas',
            'sopa_ensalada',
            'postre',
            'bebida'
        ]
    },
    guadalajara: {
        id: 'guadalajara',
        name: 'Guadalajara, Jal.',
        location: 'Guadalajara, Jalisco',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRb-eCXM_jXQkP3zGF8c3uHaiAzcFFWYvPm3bEptott3Yfs3Mzw_WgJqRICvBYAbDetImzlRCdjjREg/pub?gid=0&single=true&output=csv',
        whatsappNumber: '5216563237998',
        contactEmail: 'contacto@gpoave.com',
        companyName: 'GRUPO AVE & APTIV',
        logoAptivEnabled: true,
        whatsappMessagePrefix: 'REPORTE DE APROBACIÓN - GUADALAJARA',
        categories: [
            'desayuno_1',
            'desayuno_2',
            'desayuno_3',
            'desayuno_4',
            'guisado_fuerte',
            'antojito',
            'guarnicion_1',
            'guarnicion_2',
            'sopa_ensalada',
            'postre',
            'bebida'
        ]
    },
    juarez: {
        id: 'juarez',
        name: 'Juarez, Chih.',
        location: 'Cd. Juárez, Chihuahua',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVKjuyjKt86Sl8v77xjm1Q1Akg3v_kFh5K0l1eJDAv5sanXyxGEC7amU58B3FltXJ2KXABZtu-x9do/pub?gid=0&single=true&output=csv',
        whatsappNumber: '5216563237998',
        contactEmail: 'contacto@gpoave.com',
        companyName: 'GRUPO AVE & APTIV',
        logoAptivEnabled: true,
        whatsappMessagePrefix: 'REPORTE DE APROBACIÓN - JUÁREZ',
        isMultiBar: true,
        barsConfig: JUAREZ_BARS,
        csvPrefixes: {
            'D_': 'desayuno',
            'T_': 'tradicional',
            'S_': 'show',
            'V_': 'variedad',
            'B_': 'burritos'
        }
    },
    jabil_cuu: {
        id: 'jabil_cuu',
        name: 'Chihuahua, Chih. (Jabil)',
        location: 'Chihuahua, Chihuahua',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSG_-vs7Y2natNJlD9xzn0o1gRDTgpLLNWPNGC3g9qi85JIox2rj4kTAvx3r2aTK45DslfzAk_7eRy4/pub?gid=344725499&single=true&output=csv',
        whatsappNumber: '5216563237998',
        contactEmail: 'contacto@gpoave.com',
        companyName: 'GRUPO AVE & JABIL',
        logoAptivEnabled: false,
        logoJabilEnabled: true,
        whatsappMessagePrefix: 'REPORTE DE APROBACIÓN - JABIL CUU',
        themeColor: [0, 192, 227], // Jabil Cyan
        isMultiBar: true,
        barsConfig: JABIL_BARS,
        csvPrefixes: {
            'T_': 'tradicional',
            'G_': 'grill',
            'L_': 'light'
        }
    }
};

export const getActivePlant = () => {
    const plantId = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PLANT_ID || process.env.VITE_PLANT_ID : '') || 'monclova';
    return PLANTS[plantId] || PLANTS.monclova;
};
