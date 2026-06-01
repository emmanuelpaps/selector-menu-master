# Guía de Despliegue: Selector de Menú 2.0 (Vercel + Firebase)

Este documento describe los pasos necesarios para configurar el nuevo proyecto en **Firebase** y desplegar la aplicación en **Vercel** usando **GitHub**.

---

## Paso 1: Configurar el Proyecto en Firebase

1. Ingresa a la [Consola de Firebase](https://console.firebase.google.com/) y haz clic en **"Agregar proyecto"**.
2. Asigna un nombre a tu proyecto (ej: `ave-selectores`) y finaliza la creación.

### A. Habilitar la Base de Datos (Cloud Firestore)
1. En el menú lateral de la consola de Firebase, ve a **Build (Compilación) > Firestore Database**.
2. Haz clic en **"Crear base de datos"**.
3. Selecciona la ubicación de tu base de datos (se recomienda una cercana, como `us-central`).
4. Inicia en **"Modo de prueba"** o **"Modo de producción"**.
5. Ve a la pestaña de **Rules (Reglas)** y pega el contenido de nuestro archivo local `firestore.rules` para asegurar la base de datos. Presiona **Publicar**.

### B. Habilitar la Autenticación (Firebase Auth)
1. En el menú lateral, ve a **Build (Compilación) > Authentication**.
2. Haz clic en **"Comenzar"**.
3. En la pestaña **"Sign-in method" (Método de inicio de sesión)**, selecciona **Correo electrónico/contraseña**.
4. Habilita la primera opción (Correo electrónico/contraseña) y haz clic en **Guardar**.
5. Ve a la pestaña **Users (Usuarios)** y haz clic en **"Agregar usuario"**. Registra tu correo administrativo y una contraseña (estos datos los usarás para entrar al panel `/admin`).

### C. Obtener Credenciales de Cliente
1. Ve a la **Configuración del proyecto** (icono de engranaje en la esquina superior izquierda).
2. En la pestaña **General**, ve al final de la página y en "Tus apps", haz clic en el icono de **Web (`</>`)** para registrar una nueva app.
3. Asigna un nombre a la aplicación (ej: `web-portal`) y haz clic en **Registrar app**.
4. Copia el objeto de configuración `firebaseConfig` que se te muestra. Lucirá similar a esto:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "ave-selectores.firebaseapp.com",
     projectId: "ave-selectores",
     storageBucket: "ave-selectores.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```

---

## Paso 2: Configurar las Variables de Entorno

Crea un archivo llamado `.env.local` en la raíz del proyecto (este archivo nunca se sube a GitHub por seguridad) y copia las credenciales que obtuviste en el paso anterior:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ave-selectores.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ave-selectores
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ave-selectores.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef...
```

---

## Paso 3: Subir a GitHub y Conectar con Vercel

1. Sube tu código al repositorio en GitHub.
2. Ingresa a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **"Add New... > Project"**.
4. Selecciona tu repositorio recién subido y haz clic en **Import**.
5. Despliega la pestaña **"Environment Variables" (Variables de Entorno)** e ingresa las variables del paso 2 una a una.
6. Haz clic en **Deploy**. ¡Vercel compilará y publicará tu sitio automáticamente!

---

## Paso 4: Inicialización Automática de Plantas (Sembrado de Datos)

Para evitar que tengas que capturar a mano los datos base y contraseñas de las 5 plantas en Firestore, en el panel administrativo (`/admin`) hemos agregado un botón para **Inicializar Datos de Plantas**. Al presionarlo una sola vez al iniciar el sistema, se generará la base de datos completa de plantas automáticamente con la contraseña maestra por defecto: `AVE2026`.
Puedes cambiar las contraseñas maestras o números de WhatsApp de cada planta directamente desde la consola de Firestore cuando lo requieras.
