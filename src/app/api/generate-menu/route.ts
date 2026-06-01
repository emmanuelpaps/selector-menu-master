import { NextResponse } from 'next/server';
import { PLANTS } from '../../../config/plants';
import { STANDARD_CATEGORIES } from '../../../data/menu';

export async function POST(request: Request) {
    try {
        const { plantId, barId } = await request.json();

        if (!plantId || !barId) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios (plantId, barId)' }, { status: 400 });
        }

        const plant = PLANTS[plantId];
        if (!plant) {
            return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY no está configurada' }, { status: 500 });
        }

        // Determinar categorías para esta barra/planta
        let categories: string[] = [];
        if (plant.isMultiBar && plant.barsConfig) {
            const barConf = plant.barsConfig.find(b => b.id === barId);
            categories = barConf?.categories || plant.categories || STANDARD_CATEGORIES;
        } else {
            categories = plant.categories || STANDARD_CATEGORIES;
        }

        // Determinar días a generar según la planta
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        if (plantId === 'monclova') {
            days.push('Viernes 3er Turno');
        }
        if (plantId === 'jabil_cuu') {
            days.push('Sábado', 'Domingo');
        }

        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const prompt = `Eres un chef y planificador gastronómico experto en comedores industriales para maquilas en México (Grupo AVE).
Tu tarea es generar un menú semanal completo, variado y delicioso para la planta "${plant.name}" (Empresa: "${plant.companyName}"), en la sección/barra "${barId}".

Días a generar:
${days.map((d, i) => `${i}. ${d}`).join('\n')}

Para cada día, debes proponer platillos para las siguientes categorías de menú:
${categories.join(', ')}

Reglas obligatorias:
1. Variedad de proteínas: Alterna la proteína principal día con día (pollo, res, puerco, marisco). No repitas la misma proteína dos días seguidos.
2. Formato: Escribe el nombre de los platillos en Title Case (ej. "Milanesa de Cerdo con Papas" o "Tacos al Pastor").
3. Alternativas: Para cada platillo propuesto, sugiere exactamente 2 alternativas realistas y deliciosas en un arreglo (ej. ["Pechuga de Pollo Asada", "Enchiladas Verdes"]).
4. Coherencia: Si la categoría es "postre", sugiere gelatinas, flanes, arroz con leche o pays. Si es "bebida" o "bebida_caliente", sugiere aguas frescas del día o cafés/tés coherentes.
5. Retorna la respuesta únicamente en formato JSON con la siguiente estructura exacta:
{
  "menu": [
    {
      "dayIndex": number, // Índice 0-based correspondiente al día generado
      "dayName": "string",
      "dishes": [
        {
          "type": "string", // Uno de los nombres de categorías listados anteriormente
          "name": "string", // El platillo sugerido
          "alternatives": ["string", "string"] // Exactamente 2 alternativas
        }
      ]
    }
  ]
}

NO añadas formato Markdown (como \`\`\`json) ni textos adicionales. Devuelve únicamente el string JSON parseable.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error('Error al llamar a Gemini API:', errData);
            return NextResponse.json({ error: 'Error del proveedor de IA' }, { status: response.status });
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!responseText) {
            return NextResponse.json({ error: 'Respuesta vacía de Gemini' }, { status: 500 });
        }

        const menuJSON = JSON.parse(responseText);
        return NextResponse.json(menuJSON);
    } catch (error: any) {
        console.error('Excepción en /api/generate-menu:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
