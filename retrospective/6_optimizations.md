# Optimizations

Técnicas de optimización aplicadas para mejorar el rendimiento de la plataforma a medida que la ingesta de datos de comedores crece exponencialmente:

## 1. Memorización de Componentes Secundarios (`React.useMemo` y `React.useCallback`)
*   **Contexto:** El renderizado de 4 barras (Tradicional, Show, Variedad, Burritos) que cada una contiene 4 semanas de 5 días de 5 platillos genera un árbol DOM profundo en `App.tsx` y `MenuTable.tsx`.
*   **Optimización Aplicada:** Se encapsuló la iteración de semanas disponibles en un `useMemo(..., [plant.id, allBars, activeBarId])`. Esto previene que React recalcule todo el grid entero cada vez que un usuario tipea su nombre en el input inferior o cambia de barra.

## 2. Inyección de Hexadecimales a RGB en Demanda
*   **Contexto:** Generación nativa de PDFs multiplanta.
*   **Optimización Aplicada:** En lugar de forzar a que el diccionario maestro `JUAREZ_BARS` pre-calcule arrays RGB manuales para jsPDF, la lógica extrae los atributos visuales limpios (`#e63946`) y aplica un conversor `hexToRgb()` al momento exacto de inyectar las celdas en el Canvas. Esto mantiene la base de datos de menús libre de acoplamiento con la librería de renderizado específica.

## 3. Limitación Táctica de Datos por WhatsApp (Circuit Breaker)
*   **Contexto:** WhatsApp Web e iOS crashan silenciosamente si intentas enviar links con variables URI (el texto codificado del mensaje) de más de ciertos miles de caracteres.
*   **Optimización Aplicada:** Ocultar el botón para la planta Juárez, que excede el límite operativo sano con sus 4 semanas continuas, redirige orgánicamente al gerente hacia el documento PDF, previniendo errores de sistema operativo o lentitudes.
