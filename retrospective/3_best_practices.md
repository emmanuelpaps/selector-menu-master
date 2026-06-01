# Best Practices

Mejores prácticas consolidadas en el desarrollo del ecosistema "Selector de Menú":

## Arquitectura de Configuración por Planta (`plants.ts`)
*   **Centralización:** Utilizar un objeto centralizado (`PLANTS = { monclova: {...}, juarez: {...} }`) en el código fuente. Esto permite utilizar una sola base de código React (Single Page Application) que se compila condicionalmente mediante variables de entorno (`vite build --mode juarez`).
*   **Escalabilidad:** Si se necesita añadir una "Planta Monterrey" en el futuro, los componentes web y lógicos permanecen intactos; y sola se expande este diccionario con la nueva URL del CSV y atributos.

## Tipado Estricto (TypeScript) en el Fronend
*   Definir interfaces rígidas (`DayMenu`, `WeeklyMenu`, `Dish`) nos protegió contra datos silenciosamente nulos provenientes del CSV.
*   Esto asegura que los fallos de lectura mapeen directamente en la UI como "Platillo no encontrado" en lugar de hacer crashear la jerarquía subyacente de React.

## Componentización y Aislamiento de Lógicas
*   **Exportación Limpia:** Separar todo el código imperativo de exportación a PDF (`pdfService.ts`) fuera del ciclo de vida del componente UI principal (`App.tsx`). El DOM se vuelve extremadamente ligero, dejando que el motor JS genere y estilice el PDF de manera agnóstica a la vista actual, recibiendo solo props y arrays serializados.
