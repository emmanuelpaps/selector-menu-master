export type BarType = 'desayuno' | 'tradicional' | 'show' | 'variedad' | 'burritos' | 'grill' | 'light';

export interface BarConfig {
    id: BarType;
    label: string;
    color: string;
    lightColor: string;
    categories: string[];
}

export interface Dish {
    id: string;
    name: string;
    originalName?: string;
    type: string; // Dynamic for Juarez
    alternatives: string[];
    proteinType?: 'pollo' | 'res' | 'puerco' | 'marisco';
}

export interface DayMenu {
    day: string;
    date: string;
    dishes: Dish[];
}

export interface WeeklyMenu {
    mondayDate: string;
    menu: DayMenu[];
    expirationDate?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
    // Guadalajara / General
    desayuno_1: 'Desayuno 1',
    desayuno_2: 'Desayuno 2',
    desayuno_3: 'Desayuno 3',
    desayuno_4: 'Desayuno 4',
    bebida_caliente: 'Bebida Caliente',
    plato_fuerte: 'Plato Fuerte',
    platillo_especial: 'Platillo Especial',
    plato_fuerte_2: 'Plato Fuerte 2',
    guisado_fuerte: 'Guisado Fuerte',
    antojito: 'Antojito',
    guarnicion_1: 'Guarnición 1',
    guarnicion_2: 'Guarnición 2',
    sopa_ensalada: 'Sopa / Ensalada',
    barra_de_ensaladas: 'Barra de Ensaladas',
    postre: 'Postre',
    bebida: 'Bebida de Día',
    barra_de_frutas: 'Barra de Frutas',
    viernes_3er_turno: 'Viernes 3er Turno',

    // Jabil
    tradicional: 'Tradicional',
    grill: 'Grill',
    light: 'Light',
    light_proteina: 'Proteína',
    light_guarnicion_1: 'Guarnición',
    light_caldo: 'Caldo',
    light_ensalada: 'Ensalada',
    light_topping: 'Topping 5',
    light_semilla: 'Semilla',
    light_postre: 'Postre',
    light_complemento: 'Complemento',
    tradicional_desayuno_1: 'Desayuno 1',
    tradicional_desayuno_2: 'Desayuno 2',
    tradicional_desayuno_3: 'Desayuno 3',
    tradicional_bebidas: 'Bebidas',
    tradicional_plato: 'Plato Fuerte',
    tradicional_guarnicion_1: 'Guarnición',
    tradicional_guarnicion_2: 'Guarnición',
    tradicional_ensalada: 'Ensalada',
    tradicional_sopa: 'Sopa',
    tradicional_cereal: 'Cereal',
    tradicional_pan: 'Pan',
    tradicional_fruta_yogurth: 'Fruta / Yogurt',
    tradicional_postre: 'Postre',
    tradicional_salsa_1: 'Salsa 1',
    tradicional_salsa_2: 'Salsa 2',
    grill_plato_1: 'Plato Fuerte 1',
    grill_plato_2: 'Plato Fuerte 2',
    grill_guarnicion_1: 'Guarnición',
    grill_guarnicion_2: 'Guarnición',

    // Juarez Specific / Backwards Compatibility
    desayuno_principal: 'Plato Principal',
    desayuno_opcion1: 'Opción 1',
    desayuno_opcion2: 'Opción 2',
    acompañamiento: 'Acompañamiento',
    bebida_desayuno: 'Bebida',
    show_principal: 'Plato Principal SHOW',
    variedad_tipo: 'Especialidad del Día',
    sopa: 'Sopa',
    burrito_1: 'Opción de Burrito 1',
    burrito_2: 'Opción de Burrito 2',
    burrito_3: 'Opción de Burrito 3',
    burrito_4: 'Opción de Burrito 4',
    burrito_5: 'Opción de Burrito 5',
    burrito_6: 'Opción de Burrito 6',
    burrito_7: 'Opción de Burrito 7',
    burrito_8: 'Opción de Burrito 8'
};

export const STANDARD_CATEGORIES = [
    'desayuno_1',
    'desayuno_2',
    'desayuno_3',
    'desayuno_4',
    'bebida_caliente',
    'plato_fuerte',
    'plato_fuerte_2',
    'platillo_especial',
    'guisado_fuerte',
    'antojito',
    'guarnicion_1',
    'guarnicion_2',
    'sopa_ensalada',
    'barra_de_ensaladas',
    'postre',
    'bebida',
    'barra_de_frutas'
];

export const JUAREZ_BARS: BarConfig[] = [
    {
        id: 'desayuno',
        label: 'Desayuno',
        color: '#EAB308', // Yellow
        lightColor: '#FEF08A',
        categories: ['desayuno_principal', 'desayuno_opcion1', 'desayuno_opcion2', 'guarnicion_1', 'acompañamiento', 'bebida_desayuno']
    },
    {
        id: 'tradicional',
        label: 'Tradicional',
        color: '#0284C7', // Original AVE Blue
        lightColor: '#E0F2FE',
        categories: ['plato_fuerte', 'antojito', 'guarnicion_1', 'guarnicion_2', 'sopa', 'postre']
    },
    {
        id: 'show',
        label: 'SHOW',
        color: '#DC2626', // Red
        lightColor: '#FEE2E2',
        categories: ['show_principal', 'guarnicion_1', 'guarnicion_2']
    },
    {
        id: 'variedad',
        label: 'Variedad',
        color: '#16A34A', // Green
        lightColor: '#DCFCE7',
        categories: ['variedad_tipo']
    },
    {
        id: 'burritos',
        label: 'Burritos',
        color: '#9333EA', // Purple
        lightColor: '#F3E8FF',
        categories: ['burrito_1', 'burrito_2', 'burrito_3', 'burrito_4', 'burrito_5', 'burrito_6', 'burrito_7', 'burrito_8']
    }
];

export const JABIL_BARS: BarConfig[] = [
    {
        id: 'tradicional',
        label: 'Tradicional',
        color: '#0284C7', // AVE Blue
        lightColor: '#E0F2FE',
        categories: [
            'tradicional_desayuno_1',
            'tradicional_desayuno_2',
            'tradicional_desayuno_3',
            'tradicional_cereal',
            'tradicional_pan',
            'tradicional_fruta_yogurth',
            'tradicional_bebidas',
            'tradicional_plato',
            'tradicional_guarnicion_1',
            'tradicional_guarnicion_2',
            'tradicional_ensalada',
            'tradicional_sopa',
            'tradicional_postre',
            'tradicional_salsa_1',
            'tradicional_salsa_2'
        ]
    },
    {
        id: 'grill',
        label: 'Grill',
        color: '#EF4444', // Red
        lightColor: '#FEE2E2',
        categories: [
            'grill_plato_1',
            'grill_plato_2',
            'grill_guarnicion_1',
            'grill_guarnicion_2'
        ]
    },
    {
        id: 'light',
        label: 'Light',
        color: '#22C55E', // Green for Light
        lightColor: '#DCFCE7',
        categories: [
            'light_proteina',
            'light_guarnicion_1',
            'light_caldo',
            'light_ensalada',
            'light_topping',
            'light_semilla',
            'light_postre',
            'light_complemento'
        ]
    }
];

export const INITIAL_MENU: DayMenu[] = [
    {
        day: 'Lunes',
        date: '---',
        dishes: []
    }
];
