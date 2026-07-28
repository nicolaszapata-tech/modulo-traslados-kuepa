# Guía de recuperación — Si el proyecto de Vercel se elimina

> Este documento explica cómo volver a poner en producción el módulo de traslados en menos de 10 minutos si el proyecto de Vercel desaparece, el dominio se pierde, o necesitas moverlo a otra cuenta.

---

## Lo importante: el código está en GitHub

Todo el código fuente vive en:
```
https://github.com/nicolaszapata-tech/modulo-traslados-kuepa
```

Mientras ese repositorio exista, puedes reconstruir el proyecto desde cero en cualquier computador en minutos. **El proyecto de Vercel es solo la forma de publicarlo — el código real está en GitHub.**

---

## Qué necesitas para recuperarlo

- Node.js instalado (versión 18 o superior) → https://nodejs.org
- Una cuenta en Vercel → https://vercel.com (puede ser una cuenta nueva)
- Acceso al repositorio de GitHub (o una copia del código)

**No hay variables de entorno ni secretos que configurar.** Todas las URLs de n8n están dentro del código.

---

## Pasos para desplegar desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/nicolaszapata-tech/modulo-traslados-kuepa.git
cd modulo-traslados-kuepa
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Verificar que compila (opcional pero recomendado)

```bash
npm run build
```

Debe terminar con `✓ built in X.XXs`. Si hay errores aquí, son del código y no de la configuración.

### 4. Iniciar sesión en Vercel

```bash
npx vercel login
```

Abre el navegador y confirma el acceso con tu cuenta (GitHub, email, etc.).

### 5. Desplegar a producción

```bash
npx vercel --prod
```

Vercel preguntará algunas cosas la primera vez:
- **Set up and deploy?** → Y
- **Which scope?** → elige tu cuenta o equipo
- **Link to existing project?** → N (es nuevo)
- **Project name?** → puedes dejarlo como `modulo-traslados-kuepa` o el nombre que quieras
- **Directory?** → `.` (el directorio actual)
- **Override settings?** → N

Al terminar, Vercel da una URL como `https://modulo-traslados-kuepa-xxxx.vercel.app`.

---

## Si necesitas el dominio exacto `modulo-traslados-kuepa.vercel.app`

El subdominio `.vercel.app` depende del nombre del proyecto en Vercel. Si el proyecto anterior se eliminó, puedes reclamar el mismo nombre al crear el nuevo (paso 5 arriba, cuando pide el nombre del proyecto).

Si el nombre ya está tomado por otro proyecto tuyo:
1. Ve a https://vercel.com → tu proyecto anterior → Settings → Delete
2. Crea el nuevo proyecto con el mismo nombre

---

## Opción alternativa: importar desde GitHub directamente en Vercel

Si prefieres hacerlo desde la interfaz web sin terminal:

1. Ve a https://vercel.com/new
2. Conecta tu cuenta de GitHub
3. Busca el repositorio `modulo-traslados-kuepa`
4. Haz clic en **Import**
5. En la configuración:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Haz clic en **Deploy**

Sin variables de entorno que agregar.

---

## Si el repositorio de GitHub también desaparece

Si por alguna razón el repositorio de GitHub también se pierde, necesitas una copia local del código. Por eso es buena práctica:

1. Tener el código en tu computador local (carpeta `modulo-traslados-kuepa/`)
2. Cada vez que hagas cambios, guardarlos en GitHub con `git push`

Si solo tienes la carpeta local y no hay repositorio remoto, puedes crear uno nuevo:
```bash
# En GitHub.com → New repository → modulo-traslados-kuepa
git remote set-url origin https://github.com/TU_USUARIO/modulo-traslados-kuepa.git
git push -u origin main
```

---

## Referencia rápida — URLs que usa el sistema

Estas URLs están en el código. Si algún día n8n cambia de dominio o los webhooks cambian de nombre, estas son las que hay que actualizar:

| Archivo | URL del webhook | Para qué sirve |
|---|---|---|
| `ValidacionView.jsx` | `https://n8n.kuepa.com/webhook/asignacion-etdh` | Validación de traslados (POST) |
| `ValidacionView.jsx` | `https://n8n.kuepa.com/webhook/ultimo-sync-etdh` | Fecha último sync (GET) |
| `ReporteView.jsx` | `https://n8n.kuepa.com/webhook/disponibilidad-grupos-etdh` | Grupos disponibles (GET) |
| `DisponibilidadView.jsx` | `https://n8n.kuepa.com/webhook/disponibilidad-grupos-etdh` | Disponibilidad grupos (GET) |
| `ReporteView.jsx` | `https://n8n.kuepa.com/webhook/reporte-slack-etdh` | Envío de reporte a Slack (POST) |

Para cambiar una URL, busca el archivo, encuentra la constante al principio (ej: `const WEBHOOK_URL = '...'`), y cambia solo el valor.

---

## Tiempo estimado de recuperación

| Escenario | Tiempo |
|---|---|
| Vercel eliminado, código en GitHub | ~5 minutos |
| Vercel eliminado, código en computador local | ~10 minutos (subir a GitHub + desplegar) |
| Todo perdido (GitHub + local) | No recuperable sin backup — **mantén siempre el código en GitHub** |
