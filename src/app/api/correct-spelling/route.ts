import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text, type = 'suggested' } = await request.json();
        
        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Texto inválido o ausente' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY no está configurada' }, { status: 500 });
        }

        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        let prompt = '';

        if (type === 'alternatives') {
            prompt = `Actúa como un corrector ortográfico de platillos en español.
Corrige los acentos, la ortografía y la capitalización de cada elemento de la siguiente lista de alternativas separadas por comas.
Retorna el resultado corregido en el mismo orden, separado por comas, sin usar viñetas (•) ni añadir explicaciones.

Lista a procesar: "${text}"`;
        } else {
            prompt = `Actúa como un corrector ortográfico y gramatical de menús para comedores industriales en México.
Tu tarea es corregir y formatear el platillo recibido en español de forma limpia.

Reglas obligatorias:
1. Corrige acentos y errores ortográficos (ej. "sandia" -> "Sandía", "poyo" -> "Pollo", "calabasa" -> "Calabaza").
2. Formatea el texto en Title Case (ej. "tacos al pastor" -> "Tacos al Pastor"), excepto preposiciones y conjunciones como: de, la, el, y, con, a, las, los, del, al, por, para, o (ej. "Milanesa de Res").
3. Estandariza porciones de piezas (ej. "1 pza", "2 pzas", "3 piezas", "(1)") a "(N Pzas)" al final (ej. "(1 Pza)" o "(3 Pzas)").
4. Separa las guarniciones principales de forma limpia con una viñeta "•" y espacios (ej. "Milanesa de res con frijoles y ensalada (1 pza)" -> "Milanesa de Res • Frijoles • Ensalada (1 Pza)").
5. NO devuelvas introducciones, saludos, comentarios ni formato Markdown (como asteriscos o negritas). Retorna ÚNICAMENTE la cadena final corregida.

Texto a procesar: "${text}"`;
        }

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
                ]
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error('Error al llamar a Gemini API:', errData);
            return NextResponse.json({ error: 'Error del proveedor de IA' }, { status: response.status });
        }

        const data = await response.json();
        const correctedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!correctedText) {
            return NextResponse.json({ error: 'Respuesta vacía' }, { status: 500 });
        }

        return NextResponse.json({ correctedText });
    } catch (error: any) {
        console.error('Excepción en /api/correct-spelling:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
