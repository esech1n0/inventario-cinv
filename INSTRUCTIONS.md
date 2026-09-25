# Contexto del Proyecto
Sistema de inventario y gestión de consumo de materiales para integrantes y eventos. Permite la administración dinámica de módulos (categorías), control de stock (unitario y por paquete) y trazabilidad completa de quién retira, cuánto y para qué propósito (eventos o uso general). Funciona como una PWA (Progressive Web App) para permitir su instalación en móviles y el envío de notificaciones push.

# Tech Stack
- **Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Base de Datos:** Neon (PostgreSQL)
- **ORM:** Prisma
- **Autenticación:** NextAuth.js (Credenciales con bcrypt + soporte futuro OAuth)
- **Correos Transaccionales:** Resend o SendGrid (para recuperación de cuentas y aprobaciones)
- **Despliegue:** Vercel
- **Testing:** Vitest
- **PWA & Notificaciones:** next-pwa, Web Push API

# Reglas de Negocio y Lógica
1. **Módulos de Inventario:**
   - Módulos base: Papelería, Electrónicos, Herramientas, Componentes, Insumos.
   - Tipos de artículo:
     - *Empaquetado:* Define nombre, cantidad de paquetes, unidades por paquete y **umbral de stock bajo**.
     - *Unitario:* Define nombre, cantidad de unidades y **umbral de stock bajo**.
2. **Gestión de Stock:**
   - La vista de inventario muestra las cantidades en texto plano (sin alertas de colores por bajo stock).
   - El inventario se actualiza transaccionalmente (entradas y salidas).
3. **Registro de Consumo (Salidas) e Inmutabilidad:**
   - Al retirar stock, se debe registrar obligatoriamente: Qué se tomó, cantidad, usuario responsable y **motivo**.
   - Si el motivo es un "Evento", debe habilitarse un campo de texto para especificar su nombre.
   - **Inmutabilidad:** Las transacciones NUNCA se editan ni se borran. Cualquier error de captura humano se soluciona registrando una nueva transacción compensatoria (ej. entrada por "corrección").
4. **Notificaciones y Correos:**
   - **Push (Móviles):** Alertas (opcionales por usuario) sobre stock bajo (cuando las unidades caen por debajo del umbral del artículo) y confirmaciones de movimientos.
   - **Email (Transaccional):** Aviso automático al usuario cuando su cuenta es aprobada por un administrador y flujo de recuperación de contraseñas.

# Roles y Permisos
- **Administrador:**
  - Control total: login/logout, agregar/eliminar módulos.
  - Gestión de inventario: agregar y quitar elementos y cantidades.
  - Auditoría: visualizar reporte histórico de movimientos (debe incluir filtros por fecha/usuario/artículo y **paginación**).
  - Gestión de Usuarios: aprobar registros, suspender o eliminar cuentas.
- **Usuario Regular:**
  - Login/logout.
  - Módulos: Puede **agregar** nuevos módulos, pero **NO puede eliminarlos**.
  - Gestión de inventario: agregar y quitar elementos y cantidades.
  - Sus cuentas deben ser aprobadas por un administrador (esperando en un estado inactivo) antes de poder acceder al sistema.

# Estructura de Base de Datos (Aproximación Prisma)
- `User`: id, email, passwordHash, name, role (ADMIN/USER), isApproved, **isActive (Soft Delete)**, pushSubscription.
- `Module`: id, name, **isActive (Soft Delete)**.
- `Item`: id, moduleId, name, packagingType (UNITARY/PACKAGED), packs, unitsPerPack, totalUnits, **lowStockThreshold**.
- `Transaction`: id, itemId, userId, transactionType (IN/OUT), quantity, motive, eventName (opcional), createdAt.

# Guías de Desarrollo (Instrucciones para la IA)
- **TypeScript estricto:** Usa tipos estáticos e interfaces para todos los modelos de Prisma y props de React.
- **Borrado Lógico (Soft Deletes):** Cuando un Admin elimina un Módulo o un Usuario, NUNCA utilices un comando `DELETE` en Prisma. En su lugar, actualiza el campo `isActive` a `false`. Esto previene que se rompan las relaciones con el historial de la tabla `Transaction`. Asegúrate de filtrar por `isActive: true` en las consultas principales de la UI.
- **Server Actions:** Utiliza Server Actions de Next.js (App Router) para las mutaciones en lugar de API Routes tradicionales.
- **UI & Performance:** Construye interfaces con Tailwind CSS bajo el enfoque "Mobile First". Para las vistas de auditoría, implementa paginación desde el día 1 para soportar el crecimiento constante del historial.
- **Estado de UI:** Usa transiciones optimistas (optimistic UI) cuando los usuarios retiren material para que la web app se sienta instantánea.
- **Validación:** Implementa validación de datos (ej. Zod) antes de impactar Prisma. No permitas que transacciones de salida dejen la columna `totalUnits` en números negativos.