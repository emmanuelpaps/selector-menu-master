# Improvements

Sugerencias de valor añadido y re-arquitectura para sprints futuros de este ecosistema:

## 1. Bases de Datos Dedicadas en vez de CSV (Sheets)
*   **Propuesta:** Migrar de la lectura imperativa de Google Sheets (vía fetch crudo de CSV) a una arquitectura serverless con **Supabase** (PostgreSQL) o **Firebase** (NoSQL).
*   **Por qué:** Actualmente dependemos de que el gerente no rompa la estructura tabular de columnas (`D_Category`, etc). Una base de datos verdadera validará los tipos de datos en la entrada y nos previene de lidiar con celdas de fecha combinadas (`lastSeenDates`).

## 2. CI/CD para Hosting Autónomo
*   **Propuesta:** Implementar **GitHub Actions** o el pipeline de **Hostinger Connect**.
*   **Por qué:** Actualmente nos encontramos compilando localmente (`npm run build -- --mode juarez`) y subiendo archivos `.zip` a mano. Vincular el repositorio directamente a producción permitiría despliegues automáticos al hacer `git push`.

## 3. Caché Offline Completo (Service Workers)
*   **Propuesta:** Expandir el registro y capacidad del archivo `sw.js`.
*   **Por qué:** Si bien existe una pantalla "Offline" programada en la app, la dependencia de la señal de red para descargar el CSV inicial a las 6:00 AM en zonas industriales alejadas es un riesgo. Usar LocalStorage profundo o IndexedDB permitiría cargar la app instantáneamente con los datos de "ayer" mientras consigue señal para refrescar.

## 4. Pruebas Unitarias Automatizadas
*   **Propuesta:** Integrar **Vitest** al pipeline de Vite.
*   **Por qué:** El analizador abstracto en `sheetFetcher.ts` hace el trabajo pesado del "Parseo de Celdas Combinadas". Añadir pruebas que inyecten un CSV artificial y prueben que el array de 8 burritos salga ordenado salvaría tiempo de pruebas manuales antes de compilar cada planta.
