# Issues and Mistakes

Durante el desarrollo de la expansión de 4 semanas para la planta Juárez, experimentamos algunas complicaciones técnicas que sirven como aprendizaje:

## 1. Errores de Sintaxis JSX al Refactorizar
*   **Contexto:** Al intentar ocultar condicionalmente el botón de WhatsApp en `App.tsx` (`{plant.id !== 'juarez' && ... }`).
*   **Error:** Se eliminó accidentalmente la etiqueta de cierre `</div>` y `</button>` del bloque adyacente, lo que provocó una cascada de errores de TypeScript (`Expected corresponding JSX closing tag`).
*   **Solución:** Revertir cuidadosamente la estructura del árbol DOM y utilizar herramientas de linting (como `tsc --noEmit`) antes de inyectar los cambios a producción.

## 2. Lógica de Ciclos en jsPDF (AutoTable)
*   **Contexto:** Al generar el PDF nativo para Juárez.
*   **Error:** El cálculo continuo de la coordenada `Y` (`currentY`) para colocar múltiples tablas (las 4 barras) colapsaba al iterar sobre múltiples semanas, causando sobreescrituras en el documento o tablas cortadas. El valor de `pageBreak: 'avoid'` causaba saltos no deseados.
*   **Solución:** Cambiar el comportamiento a `pageBreak: 'auto'` y resetear correctamente `currentY` al inicio de cada iteración de semana, leyendo estrictamente desde `doc.lastAutoTable.finalY`.

## 3. Ambientes Locales vs Remotos en Testing
*   **Contexto:** Pruebas del analizador CSV `sheetFetcher.ts`.
*   **Error:** Intentar usar un servidor Python HTTP en `localhost` para alimentar un archivo `.csv` local, lo cual rompía las compatibilidades de entorno de Node.js al requerir librerías como `fs` o extensiones `ts-node`.
*   **Solución:** Depender exclusivamente del entorno nativo del navegador (Browser Subagent) y enlaces públicos en formato CSV crudo para garantizar paridad con producción.

## 4. Ocultamiento de Elementos vs Bloqueo Funcional
*   **Contexto:** Exportación por WhatsApp de menús masivos.
*   **Error:** Al principio se consideró dejar el botón pero limitar la data. Sin embargo, procesar 4 barras para 4 semanas generaría la apertura de web.whatsapp con un payload tan masivo que crashearía la intención (URI Too Long).
*   **Solución:** Ocultar el componente UI por completo de forma reactiva (`if plant.id === 'juarez'`).
