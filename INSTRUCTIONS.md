# Contexto del Proyecto
Sistema de inventario y gestión de consumo de materiales para integrantes y eventos. Permite la administración dinámica de módulos (categorías), control de stock (unitario y por paquete) y trazabilidad completa de quién retira, cuánto y para qué propósito (eventos o uso general). Funciona como una PWA (Progressive Web App) para permitir su instalación en móviles y el envío de notificaciones push.

# Tech Stack
- **Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Base de Datos:** Neon (PostgreSQL)
- **ORM:** Prisma
- **Autenticación:** NextAuth.js (Credenciales con bcrypt + soporte futuro OAuth)
- **Despliegue:** Vercel
- **Testing:** Vitest
- **PWA & Notificaciones:** next-pwa, Web Push API

# Reglas de Negocio y Lógica
1. **Módulos de Inventario:**
   - Módulos base: Papelería, Electrónicos, Herramientas, Componentes, Insumos.
   - Tipos de artículo:
     - *Empaquetado:* Define nombre, cantidad de paquetes y unidades por paquete.
     - *Unitario:* Define nombre y cantidad de unidades.
2. **Gestión de Stock:**
   - La vista de inventario muestra las cantidades en texto plano (sin alertas de colores por bajo stock).
   - El inventario se actualiza transaccionalmente (entradas y salidas).
3. **Registro de Consumo (Salidas):**
   - Al retirar stock, el sistema debe registrar obligatoriamente: Qué se tomó, cantidad, usuario responsable y **motivo**.
   - Si el motivo es un "Evento", debe habilitarse un campo de texto para especificar el nombre del evento.
4. **Notificaciones (Push):**
   - El sistema enviará notificaciones push (opcionales por usuario) alertando sobre stock bajo de productos y confirmaciones de movimientos (entradas/salidas).

# Roles y Permisos
- **Administrador:**
  - Control total: login/logout, agregar/eliminar módulos completos.
  - Gestión de inventario: agregar y quitar elementos y cantidades.
  - Auditoría: visualizar reporte histórico de movimientos (quién, qué, cuándo, motivo).
  - Gestión de Usuarios: aprobar registros de nuevos usuarios, suspender o eliminarlos.
- **Usuario Regular:**
  - Login/logout.
  - Módulos: Puede **agregar** nuevos módulos, pero **NO puede eliminarlos**.
  - Gestión de inventario: agregar y quitar elementos y cantidades.
  - Sus cuentas deben ser aprobadas por un administrador antes de tener acceso al sistema.

# Estructura de Base de Datos (Aproximación Prisma)
- `User`: id, email, passwordHash, name, role (ADMIN/USER), isApproved, pushSubscription.
- `Module`: id, name.
- `Item`: id, moduleId, name, packagingType (UNITARY/PACKAGED), packs, unitsPerPack, totalUnits.
- `Transaction`: id, itemId, userId, transactionType (IN/OUT), quantity, motive, eventName (opcional), createdAt.

# Guías de Desarrollo (Instrucciones para la IA)
- **TypeScript estricto:** Usa tipos estáticos e interfaces para todos los modelos de Prisma y props de React.
- **Server Actions:** Utiliza Server Actions de Next.js (App Router) para las mutaciones (crear items, actualizar stock) en lugar de API Routes tradicionales.
- **UI:** Construye interfaces limpias y responsivas usando Tailwind CSS. Sigue una filosofía "Mobile First" ya que la app será usada como PWA en celulares.
- **Estado de UI:** Usa transiciones optimistas (optimistic UI) cuando los usuarios retiren material para que la aplicación se sienta instantánea en móviles.
- **Validación:** Implementa validación de datos en servidor y cliente (ej. Zod) antes de impactar Prisma. No permitas transacciones que dejen el inventario (totalUnits) en números negativos bajo ninguna circunstancia.