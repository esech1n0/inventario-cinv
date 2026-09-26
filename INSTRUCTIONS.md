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
1. **Módulos de Inventario (Entorno de Oficina):**
   - Módulos base: Papelería, Consumibles de Impresión, Equipo y Cómputo, Accesorios de Oficina.
   - Tipos de artículo:
     - *Empaquetado:* Define nombre, cantidad de paquetes, unidades por paquete y umbral de stock.
     - *Unitario:* Define nombre, cantidad de unidades y umbral de stock.
2. **Gestión de Stock:**
   - La vista de inventario muestra las cantidades en texto plano (sin alertas de colores por bajo stock).
   - El inventario se actualiza transaccionalmente (entradas y salidas).
3. **Registro de Consumo (Salidas) y Motivos:**
   - Al retirar stock, el motivo de salida está estrictamente limitado a 3 opciones:
     - **Para mi**
     - **Para evento** (requiere especificar el nombre del evento)
     - **Para la coordinación**
   - **Inmutabilidad:** Las transacciones NUNCA se editan ni se borran. Cualquier error de captura humano se soluciona registrando una nueva transacción compensatoria.
   - **Visualización en App:** El historial y auditoría de movimientos se consulta exclusivamente en la interfaz web/PWA (sin exportación a Excel).
4. **Seguridad y Verificación 2FA (OTP):**
   - Verificación en Dos Pasos obligatoria para inicio de sesión: tras validar contraseña, se genera y envía un código OTP de 6 dígitos al correo del usuario registrado. Solo tras validar dicho código se concede acceso al sistema.
5. **Notificaciones:**
   - **Push (Móviles):** Alertas sobre stock bajo y confirmaciones de movimientos.

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