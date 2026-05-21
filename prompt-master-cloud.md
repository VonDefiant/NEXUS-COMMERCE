# Prompt para el Sistema Master (SaaS) v2.0 - Funciones Avanzadas

Copia este texto y pégalo en una **nueva ventana/chat de Google AI Studio** (o en la sesión donde ya creaste la base del Master Hub) para expandir sus funcionalidades, asegurando que mantenga la misma estética y sea 100% robusto.

---

**Copia desde aquí:**

¡Hola de nuevo! El diseño base del Panel Super Admin "Nexus Master Hub" ha quedado excelente. Ahora actúa como Ingeniero Senior y Diseñador de Producto para **expandir este Panel Master** con las siguientes funcionalidades críticas. Mantén rigurosamente el estilo de diseño impecable (Tailwind `slate`, bordes `rounded-xl`, botones `bg-nexus-primary`, minimalismo).

### Nuevos Requerimientos y Funcionalidades Clave:

**1. Revocación y Control Estricto de Licencias (Backend + UI):**
*   **Acción de Revocar:** En la Vista de Detalle de un Cliente, agrega un botón destructivo (rojo `rose-600`) para "Revocar Licencia" manualmente.
*   Al revocar, el backend debe actualizar la BD y **regenerar la firma criptográfica** marcando el status de la licencia como `'revoked'` y la fecha de expiración como el momento actual.
*   Muestra inmediatamente el nuevo Payload SQL/JSON con la firma revocada generada, listo para cortar el acceso al servidor remoto.

**2. Panel de Auditoría Maestra (Audit Logs):**
*   Crea un modelo en Prisma `AuditLog` (action, description, userId, targetBusinessId, createdAt).
*   **Sidebar Menu:** Agrega un nuevo menú en la barra lateral llamado "Registro de Auditoría".
*   **Vista:** Crea una tabla inmutable (solo lectura) que muestre un historial de todo lo que ocurre en el Master Hub. Ejemplos de eventos a guardar:
    *   "La licencia para *Acme Corp* fue renovada hasta 2027 por *Usuario Admin*."
    *   "La licencia de *Test Business* fue REVOCADA por *Usuario Admin*."
    *   "Ping recibido desde *Acme Corp* (IP cambiada)."

**3. Historial de Telemetría y Salud del Nodo:**
*   **Heartbeats:** Agrega un histórico de "Heartbeats" para saber qué días el cliente envió ping exitosamente.
*   **UI - Indicadores de Salud (Health Score):** Mejora las tarjetas del "Dashboard" y "Clientes" agregando un semáforo de estado:
    *   `Healthy (Verde)`: Ping reciente (< 24 hrs).
    *   `Warning (Amarillo)`: Sin ping entre 24 y 48hrs, o licencia próxima a vencer (< 7 días).
    *   `Critical (Rojo)`: Servidor offline (> 48hrs sin ping) o licencia expirada/revocada.

**4. Notificaciones y Alertas Rápidas:**
*   En el "Dashboard Principal", añade una sección de **"Intervención Requerida (Action Required)"** para identificar rápidamente a los clientes que están en estado Warning o Critical y necesitan soporte proactivo.

**5. Gestión Avanzada del Master (Opcional - Configuración):**
*   Crea una pestaña pequeña o modal de "Configuración del Máster" donde muestres un panel de verificación del entorno (ej. Verificar si `NEXUS_LICENSE_SECRET` está cargado correctamente en `process.env` para evitar firmar con una key insegura).

**Regla estricta de UI:** No cambies nada de la paleta de colores. Utiliza iconos asombrosos de `lucide-react`. La página de Detalles de Nodo debe parecer un Command Center profesional de ciberseguridad corporativa. ¡Adelante con la implementación!
