# Guía paso a paso para reinstalar el módulo desde cero
### Para personas sin experiencia técnica

> Esta guía asume que nunca has hecho esto antes. Sigue cada paso en orden, sin saltarte ninguno. Si algo no funciona, lee el mensaje de error completo — generalmente dice exactamente qué falta.

---

## ¿Qué vamos a hacer?

El módulo de traslados es una página web que vive en **Vercel** (un servicio gratuito que la publica en internet). El código fuente está guardado en **GitHub** (como una carpeta en la nube). 

Lo que harás es:
1. Descargar el código desde GitHub a tu computador
2. Instalar las herramientas necesarias
3. Publicarlo de nuevo en Vercel

**Tiempo estimado: 20 a 30 minutos** (la mayoría es esperar descargas)

---

## Antes de empezar — ¿qué necesitas?

- Un computador con Windows 10 u 11
- Conexión a internet
- Una cuenta en Vercel (si no tienes, se crea gratis en el paso 4)
- Acceso al repositorio de GitHub: `https://github.com/nicolaszapata-tech/modulo-traslados-kuepa`

---

## PASO 1 — Instalar Git

**¿Qué es Git?** Es un programa que permite descargar código desde GitHub a tu computador.

1. Abre tu navegador (Chrome, Edge, Firefox — cualquiera)
2. Ve a esta dirección: **https://git-scm.com/download/win**
3. La descarga empieza automáticamente. Si no empieza, haz clic en el enlace que dice *"Click here to download"*
4. Cuando termine la descarga, abre el archivo `.exe` que se descargó
5. En el instalador, haz clic en **Next** en todas las pantallas sin cambiar nada — los valores por defecto están bien
6. Al final haz clic en **Finish**

**¿Cómo saber si quedó instalado?**

1. Presiona las teclas **Windows + R** al mismo tiempo
2. Escribe `cmd` y presiona Enter — se abre una ventana negra (esto es la "terminal" o "consola")
3. Escribe exactamente esto y presiona Enter:
   ```
   git --version
   ```
4. Debe aparecer algo como `git version 2.xx.x` — si aparece eso, Git está instalado correctamente

---

## PASO 2 — Instalar Node.js

**¿Qué es Node.js?** Es el motor que necesita el proyecto para funcionar y para publicarse en Vercel.

1. Ve a: **https://nodejs.org**
2. Verás dos botones de descarga. Haz clic en el que dice **LTS** (es la versión estable recomendada)
3. Abre el archivo `.msi` que se descargó
4. En el instalador, haz clic en **Next** en todas las pantallas sin cambiar nada
5. Al final haz clic en **Finish**

**¿Cómo verificar que quedó instalado?**

1. Cierra la ventana negra (terminal) si la tenías abierta y ábrela de nuevo (Windows + R → `cmd` → Enter)

   > **Importante:** siempre que instales algo nuevo, cierra y vuelve a abrir la terminal para que reconozca los cambios.

2. Escribe esto y presiona Enter:
   ```
   node --version
   ```
3. Debe aparecer algo como `v20.x.x` o superior
4. Luego escribe esto y presiona Enter:
   ```
   npm --version
   ```
5. Debe aparecer un número como `10.x.x`

Si ambos comandos muestran un número, Node.js está listo.

---

## PASO 3 — Descargar el código desde GitHub

**¿Qué significa "clonar"?** Es descargar una copia exacta del proyecto a tu computador.

1. En la terminal (ventana negra), navega al lugar donde quieres guardar el proyecto. Por ejemplo, para guardarlo en el Escritorio escribe:
   ```
   cd %USERPROFILE%\Desktop
   ```
   y presiona Enter.

   > Si quieres guardarlo en otra carpeta, cambia `Desktop` por el nombre de la carpeta. Por ejemplo: `cd %USERPROFILE%\Documents`

2. Ahora descarga el código escribiendo esto y presionando Enter:
   ```
   git clone https://github.com/nicolaszapata-tech/modulo-traslados-kuepa.git
   ```

3. Verás varias líneas de texto que terminan con algo como `Resolving deltas: done.` — eso significa que se descargó correctamente.

4. Entra a la carpeta que se creó:
   ```
   cd modulo-traslados-kuepa
   ```

---

## PASO 4 — Crear una cuenta en Vercel (si no tienes)

1. Ve a **https://vercel.com** en tu navegador
2. Haz clic en **Sign Up**
3. Puedes registrarte con tu cuenta de GitHub — es la opción más fácil. Haz clic en **Continue with GitHub**
4. Autoriza a Vercel a acceder a tu GitHub
5. Listo — ya tienes cuenta en Vercel

---

## PASO 5 — Instalar la herramienta de Vercel en tu computador

1. En la terminal (ventana negra), asegúrate de estar dentro de la carpeta `modulo-traslados-kuepa` (el paso 3 ya te puso ahí)
2. Escribe esto y presiona Enter:
   ```
   npm install
   ```
3. Esto descarga todas las librerías que necesita el proyecto. Verás muchas líneas de texto. Espera hasta que termine — puede tardar 1 o 2 minutos.
4. Cuando termine verás algo como `added 53 packages` — eso es normal.

---

## PASO 6 — Iniciar sesión en Vercel desde la terminal

1. En la misma terminal, escribe esto y presiona Enter:
   ```
   npx vercel login
   ```
2. Te preguntará cómo quieres iniciar sesión. Usa las flechas del teclado para seleccionar **Continue with GitHub** y presiona Enter
3. Se abrirá automáticamente tu navegador con una pantalla de confirmación
4. Haz clic en **Confirm** en el navegador
5. Vuelve a la terminal — debe decir algo como `Congratulations! You are now logged in`

---

## PASO 7 — Publicar el proyecto en Vercel

1. En la terminal, escribe esto y presiona Enter:
   ```
   npx vercel --prod
   ```

2. La primera vez que publicas en una cuenta nueva, Vercel hace unas preguntas. Respóndelas así:

   | Pregunta | Respuesta |
   |---|---|
   | `Set up and deploy?` | Escribe `y` y presiona Enter |
   | `Which scope?` | Selecciona tu cuenta con las flechas y presiona Enter |
   | `Link to existing project?` | Escribe `n` y presiona Enter |
   | `What's your project's name?` | Escribe `modulo-traslados-kuepa` y presiona Enter |
   | `In which directory is your code located?` | Solo presiona Enter (el punto `.` ya está seleccionado) |
   | `Want to modify these settings?` | Escribe `n` y presiona Enter |

3. Vercel empieza a publicar el proyecto. Verás líneas de texto con el progreso. Espera — puede tardar entre 1 y 3 minutos.

4. Cuando termine, verás algo como:
   ```
   Production: https://modulo-traslados-kuepa-xxxx.vercel.app
   ```

   Esa dirección es tu módulo publicado. Cópiala y ábrela en el navegador para verificar que funciona.

---

## PASO 8 — Verificar que todo funciona

1. Abre la URL que te dio Vercel en el paso anterior
2. Debes ver la pantalla de inicio del módulo de traslados
3. Entra a "Disponibilidad de Grupos" y verifica que carguen los datos
4. Entra a "Validación de Traslados" y prueba cargar datos

Si todo se ve igual que antes, la reinstalación fue exitosa.

---

## Problemas comunes y soluciones

### "git no se reconoce como un comando"
Cerraste la terminal antes de que Git terminara de instalarse, o la terminal ya estaba abierta cuando instalaste Git. Ciérrala y ábrela de nuevo.

### "npm no se reconoce como un comando"
Mismo problema — cierra y abre la terminal después de instalar Node.js.

### "error: repository not found" al clonar
El repositorio de GitHub no es accesible. Verifica que tengas acceso a `https://github.com/nicolaszapata-tech/modulo-traslados-kuepa` desde el navegador. Si el repositorio es privado, necesitas tener tu sesión de GitHub iniciada en el navegador y darle acceso a Git (ver Paso 1 extra más abajo).

### "Error: You must be logged in to deploy" en Vercel
No completaste el login del Paso 6. Vuelve a correr `npx vercel login` y confirma en el navegador.

### La página abre pero no carga datos
El módulo en sí funciona, pero los datos vienen de n8n (otro sistema). Revisa que los workflows de n8n estén activos en `https://n8n.kuepa.com`. Esto no es un problema de Vercel.

---

## Paso 1 extra — Si Git pide credenciales de GitHub al clonar

Si el repositorio de GitHub es privado, al correr `git clone` te pedirá usuario y contraseña. La contraseña de GitHub ya no funciona directamente — debes usar un "token":

1. Ve a GitHub.com → tu foto de perfil (arriba a la derecha) → **Settings**
2. En el menú izquierdo, baja hasta **Developer settings**
3. Haz clic en **Personal access tokens** → **Tokens (classic)**
4. Haz clic en **Generate new token (classic)**
5. En "Note" escribe algo como "modulo-traslados"
6. Marca la casilla **repo**
7. Haz clic en **Generate token** al fondo
8. Copia el token que aparece (solo se muestra una vez)
9. Cuando Git te pida contraseña, pega ese token

---

## Resumen en una sola hoja

Si ya hiciste todo esto antes y solo necesitas recordar los comandos:

```bash
# 1. Ir al escritorio
cd %USERPROFILE%\Desktop

# 2. Descargar el código
git clone https://github.com/nicolaszapata-tech/modulo-traslados-kuepa.git
cd modulo-traslados-kuepa

# 3. Instalar dependencias
npm install

# 4. Iniciar sesión en Vercel
npx vercel login

# 5. Publicar
npx vercel --prod
```
