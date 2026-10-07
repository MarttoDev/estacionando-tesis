<div align="center">

# 🅿️ estacionando

### El Airbnb de los estacionamientos

Publica tu espacio libre, encuentra uno cerca con tiempo de viaje real, y reserva por horas — con precio sugerido, mapas y sincronización en vivo.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql&logoColor=white)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Live-black?logo=vercel)](https://estacionando.vercel.app)
[![Deployed on Render](https://img.shields.io/badge/Render-Live-46E3B7?logo=render&logoColor=white)](https://estacionando.onrender.com/api/health)

**[🚀 Ver la app en vivo](https://estacionando.vercel.app)** · **[📡 Estado de los motores](https://estacionando.onrender.com/api/health)**

</div>

---

## ✨ Qué hace

estacionando es un marketplace real, desplegado y funcionando con datos reales — no una maqueta. Cualquier persona con un espacio libre (un patio, un garage, un puesto sin usar) puede publicarlo; cualquier persona que necesite estacionar puede buscarlo, ver un precio sugerido automáticamente, y reservarlo por horas.

- 🔐 **Autenticación propia** — sesiones con token + hash, sin librerías de terceros, con validación de RUT chileno real
- 🅿️ **Publicar espacios** — wizard de 3 pasos, fotos comprimidas en el navegador, disponibilidad horaria flexible
- 📅 **Reservas sin choques** — transacciones `SERIALIZABLE` en PostgreSQL, probadas contra condiciones de carrera reales
- 💰 **Precio sugerido** — motor de heurística en Java que compara precios de la misma comuna, ocupación y hora
- 🗺️ **Mapas y "cerca de mí"** — geocodificación, rutas y tiempo de viaje real vía Mapbox, con pre-filtrado por distancia
- ⚡ **Tiempo real** — un cambio que hace alguien se refleja en el navegador de otra persona sin recargar
- 🛠️ **Panel de administración** — gestión de usuarios/espacios/reservas, y un tablero **Kanban** interno de roadmap
- 🌎 **Todo en hora de Santiago** — sin sorpresas de huso horario entre el servidor y quien mira la pantalla

---

## 🧱 Stack tecnológico

| Capa | Tecnología | Para qué |
|---|---|---|
| **Framework** | Next.js 16 (App Router) · React 19 · TypeScript | Frontend y backend a la vez, vía Server Actions |
| **Estilos** | Tailwind CSS v4 · shadcn/ui · lucide-react | Sistema de diseño con tokens OKLCH, modo claro/oscuro |
| **Datos** | Prisma ORM · PostgreSQL | Esquema tipado, migraciones versionadas (15+) |
| **Backend as a Service** | Supabase (Postgres, Storage, Realtime) | Base de datos real, fotos, sincronización en vivo |
| **Validación** | Zod | Toda entrada se valida antes de tocar la base |
| **Seguridad** | bcryptjs · sesiones con hash SHA-256 | Contraseñas y tokens nunca se guardan en texto plano |
| **Motores (servicio aparte)** | Java 21 · Spring Boot 4.1 · Maven | Precio sugerido y optimización de ruta, vía REST |
| **Mapas** | Mapbox (Geocoding · Directions · Matrix) | Direcciones reales, rutas y tiempos de viaje |
| **Infraestructura** | Docker · GitHub (CI/CD por push) | El servicio Java corre containerizado en Render |

### Dónde vive cada pieza

```
Navegador  →  Next.js (Vercel)  →  Prisma  →  PostgreSQL (Supabase)
                     │                              │
                     │                        Supabase Storage
                     │                        Supabase Realtime
                     ▼
            Java Engines (Render)  →  Mapbox APIs
```

| Plataforma | Qué aloja |
|---|---|
| **[Vercel](https://estacionando.vercel.app)** | La app de Next.js completa |
| **[Render](https://estacionando.onrender.com/api/health)** | El servicio Java (precio + ruta), vía Docker |
| **Supabase** | PostgreSQL, almacenamiento de fotos, Realtime |
| **Mapbox** | Geocodificación, mapas y rutas |

> 📄 Diagrama de componentes a fondo (con el porqué de cada decisión): [`diagrama-componentes.html`](./diagrama-componentes.html)

---

## 🚧 Roadmap

Ya construido: auth, CRUD de espacios, reservas, motor de precio, motor de ruta, panel admin, tiempo real. Lo que sigue (ver el tablero Kanban interno en `/admin`):

- [ ] Pagos reales (Webpay Plus)
- [ ] Reseñas y reputación
- [ ] Notificaciones por email
- [ ] Verificación de identidad (KYC) real
- [ ] App móvil (PWA)

---

## 🏁 Correrlo en local

```bash
# 1. Clonar e instalar
git clone https://github.com/1loro/estacionando.git
cd estacionando
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
# completa DATABASE_URL, SUPABASE_*, NEXT_PUBLIC_MAPBOX_TOKEN, ENGINES_URL

# 3. Base de datos
pnpm db:migrate

# 4. Levantar
pnpm dev
```

El servicio de motores (`/engines`) corre aparte con Maven:

```bash
cd engines
./mvnw spring-boot:run
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta Next.js en modo desarrollo |
| `pnpm build` | Build de producción |
| `pnpm db:studio` | Abre Prisma Studio para ver la base |
| `pnpm db:migrate` | Aplica migraciones pendientes |

---

## 👥 Autores

Proyecto de tesis (Capstone) — Gaspar Díaz · Martín Labra · Lorenzo Teixido

<div align="center">

[![App en vivo](https://img.shields.io/badge/🚀_Probar_la_app-estacionando.vercel.app-3352DB?style=for-the-badge)](https://estacionando.vercel.app)

</div>
