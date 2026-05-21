import "./instrument.ts";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { toNodeHandler } from "better-auth/node";
import * as Sentry from "@sentry/node";
import { auth } from "./server/auth.ts";
import { logger } from "./server/logger.ts";
import { startTelemetryPing } from "./server/telemetry.ts";
import { verifyLicenseIntegrity, generateLicenseSignature } from "./server/license-crypto.ts";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// Instancia global de Prisma
const prisma = new PrismaClient();

async function startServer() {

  const app = express();
  const PORT = 3000;

  // Habilitar trust proxy para que express-rate-limit funcione correctamente en Cloud Run
  app.set("trust proxy", 1);

  // ==========================================
  // 🛡️ SEGURIDAD Y PERFORMANCE (NÚCLEO AL 200%)
  // ==========================================
  
  // 1. Helmet: Protege contra vulnerabilidades web conocidas seteando cabeceras HTTP
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // 2. Rate Limiting: Evita ataques de fuerza bruta al API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // Límite de 500 peticiones por IP en 15 minutos
    message: { error: "Demasiadas peticiones a la API, por favor intenta más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Aplicamos el límite de peticiones solo a las rutas de API
  app.use("/api/", apiLimiter);

  // ==========================================
  // 🛡️ MIDDLEWARE DE VALIDACIÓN DE LICENCIA
  // ==========================================
  const licenseMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Solo aplica a rutas protegidas, no a auth ni a health
      const publicRoutes = [
          '/api/health',
          '/api/auth',
          '/api/v1/license/update', // Recepción de licencia del Master
      ];

      if (publicRoutes.some(r => req.path.startsWith(r))) {
          return next();
      }

      // Solo validar rutas de API protegidas
      if (!req.path.startsWith('/api/v1/')) {
          return next();
      }

      try {
          const session = await auth.api.getSession({
              headers: req.headers as unknown as HeadersInit
          });

          if (!session?.user) return next(); // El auth middleware lo rechazará después

          const user = await prisma.user.findUnique({
              where: { id: session.user.id },
              include: { business: { include: { license: true } } }
          });

          if (!user?.business?.license) return next(); // Sin empresa/licencia, pasar al siguiente

          const license = user.business.license;

          // 1. Verificar integridad criptográfica (anti-tampering)
          if (!verifyLicenseIntegrity(license)) {
              logger.error(`[LICENSE] FRAUDE DETECTADO: Licencia adulterada en empresa ${user.business.id}`);
              return res.status(403).json({
                  error: "license_tampered",
                  message: "La integridad de la licencia ha sido comprometida. Contacta a soporte."
              });
          }

          // 2. Verificar que no esté revocada
          if (license.status === 'revoked' || license.status === 'suspended') {
              return res.status(403).json({
                  error: "license_suspended",
                  message: "Licencia suspendida o revocada. Contacta a soporte."
              });
          }

          // 3. Verificar que no haya expirado
          if (new Date(license.validUntil) < new Date()) {
              return res.status(403).json({
                  error: "license_expired",
                  message: "Licencia expirada. Contacta a soporte para renovar."
              });
          }

          next();
      } catch (error: any) {
          logger.error('[LICENSE] Error en middleware de licencia', { error: error.message });
          return res.status(503).json({ error: "Error verificando licencia. Intenta de nuevo." });
      }
  };

  // Aplicar middleware a todas las rutas de API (excepto las públicas)
  app.use('/api/v1/', licenseMiddleware);

  // Middleware genérico para trazar todas las peticiones en los logs (útil para auditoría)
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
       logger.info(`[${req.method}] ${req.url} - IP: ${req.ip}`);
    }
    next();
  });

  // ==========================================
  // 🔐 BETTER AUTH (Manejo de rutas de Auth)
  // ==========================================
  const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20, // Solo 20 intentos de login por IP
      message: { error: "Demasiados intentos. Espera 15 minutos." },
      standardHeaders: true,
      legacyHeaders: false,
  });
  app.use("/api/auth/sign-in", authLimiter);

  // DEJAMOS ESTO ANTES DEL BODY PARSERS PARA EVITAR QUE EXPRESS.JSON CONSUMA EL STREAM
  app.all("/api/auth/*", toNodeHandler(auth));

  // Middleware para parsear JSON en el body de las peticiones
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // ==========================================
  // 🚀 RUTAS DEL API BACKEND (Van ANTES de Vite)
  // ==========================================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
  });

  app.get("/api/v1/auth/me", async (req, res) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as unknown as HeadersInit
      });

      if (!session || !session.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!user) {
        logger.warn(`Intento de acceso con sesión válida pero sin usuario en BD: ${session.user.id}`);
        return res.status(404).json({ error: "Usuario no encontrado en la BD principal" });
      }

      const business = await prisma.business.findFirst({
        where: process.env.NEXUS_BUSINESS_ID 
          ? { id: process.env.NEXUS_BUSINESS_ID } 
          : { users: { some: { id: session.user.id } } },
        include: { license: true },
        orderBy: { updatedAt: 'desc' }
      });

      // Validamos la integridad criptográfica de la licencia si el usuario pertenece a una empresa
      let licensePayload = null;
      if (business?.license) {
        const dbLicense = business.license;
        let effectiveStatus = dbLicense.status;

        // Comprobación de seguridad matemática
        if (!verifyLicenseIntegrity(dbLicense)) {
          logger.error(`ALERTA ROJA DE SEGURIDAD: Se detectó una licencia adulterada matemáticamente en la empresa ${business.id}. Se bloquea la cuenta inmediatamente.`);
          effectiveStatus = 'suspended'; // Congelamos instantáneamente por fraude manual en BD
        }

        licensePayload = {
          status: effectiveStatus,
          type: dbLicense.type,
          validUntil: dbLicense.validUntil,
          supportPin: dbLicense.supportPin,
          planName: dbLicense.planName
        };
      }

      // Construct payload to match frontend AppState expecting:
      const payload = {
        name: user.name,
        email: user.email,
        avatar: user.image || 'https://picsum.photos/seed/avatar1/100/100',
        businessName: business?.name || 'My Business',
        businessLogo: business?.logoUrl,
        role: user.role,
        license: licensePayload
      };

      res.json({ user: payload });
    } catch (error) {
      logger.error('Error en /api/v1/auth/me', { error });
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ==========================================
  // 📡 TELEMETRÍA (Recepción en la Nube SaaS)
  // ==========================================
  app.post("/api/v1/telemetry/ping", async (req, res) => {
    const expectedSecret = process.env.NEXUS_TELEMETRY_SECRET;
    if (!expectedSecret) {
        return res.status(503).json({ error: "Telemetría no configurada" });
    }
    const secretHeader = req.headers['x-nexus-telemetry-secret'] as string || '';
    
    if (secretHeader.length !== expectedSecret.length || !crypto.timingSafeEqual(Buffer.from(secretHeader), Buffer.from(expectedSecret))) {
      logger.warn(`Intento de ping fallido. IP: ${req.ip}`);
      return res.status(401).json({ error: "No autorizado" });
    }

    try {
      const { businessId, businessName, planName, userCount, branchCount, signature, hostingType, cpuLoad, ramUsage, dbSize } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
      const actualHostingType = hostingType || 'on-premise';

      if (!businessId) {
        return res.status(400).json({ error: "businessId es requerido" });
      }

      await prisma.telemetryPing.upsert({
        where: { businessId },
        update: {
          businessName,
          planName,
          userCount: userCount || 0,
          branchCount: branchCount || 0,
          signature,
          ipAddress,
          hostingType: actualHostingType,
          cpuLoad,
          ramUsage,
          dbSize,
          lastPingAt: new Date(),
        },
        create: {
          businessId,
          businessName,
          planName,
          userCount: userCount || 0,
          branchCount: branchCount || 0,
          signature,
          ipAddress,
          hostingType: actualHostingType,
          cpuLoad,
          ramUsage,
          dbSize,
        }
      });

      // Registrar historial de telemetría
      await prisma.telemetryHistory.create({
        data: {
          businessId,
          userCount: userCount || 0,
          branchCount: branchCount || 0,
          cpuLoad,
          ramUsage,
        }
      });

      logger.info(`📡 Censo recibido de instalación ${actualHostingType}: ${businessName || businessId} (Usuarios: ${userCount})`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error procesando telemetría', { error });
      res.status(500).json({ error: "Error interno" });
    }
  });

  // ==========================================
  // 🔑 RECEPCIÓN DE LICENCIA DESDE MASTER HUB
  // ==========================================
  app.post("/api/v1/license/update", async (req, res) => {
      try {
          // Validar que viene del Master Hub real
          const masterSecretHeader = (req.headers['x-nexus-master-secret'] as string) || '';
          const expectedSecret = process.env.NEXUS_LICENSE_SECRET;

          if (!expectedSecret || masterSecretHeader.length !== expectedSecret.length || !crypto.timingSafeEqual(Buffer.from(masterSecretHeader), Buffer.from(expectedSecret))) {
              logger.warn(`[LICENSE] Intento no autorizado desde IP: ${req.ip}`);
              return res.status(401).json({ error: "No autorizado" });
          }

          const { businessId, planName, validUntil, status, signature } = req.body;

          // Validar campos requeridos
          if (!businessId || !planName || !validUntil || !status || !signature) {
              return res.status(400).json({ error: "Campos requeridos: businessId, planName, validUntil, status, signature" });
          }

          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!UUID_REGEX.test(businessId)) {
              return res.status(400).json({ error: "businessId inválido" });
          }

          // Verificar que la firma HMAC es válida antes de guardar
          const expectedSignature = generateLicenseSignature(businessId, planName, validUntil, status);

          if (expectedSignature !== signature) {
              logger.error(`[LICENSE] ALERTA: Firma inválida recibida para businessId ${businessId}. Posible ataque.`);
              return res.status(403).json({ error: "Firma criptográfica inválida" });
          }

          // Buscar la empresa
          const business = await prisma.business.findFirst({
              where: { id: businessId },
              include: { license: true }
          });

          if (!business) {
              // Si no existe la empresa, la creamos automáticamente
              logger.info(`[LICENSE] Empresa ${businessId} no encontrada, creando entrada...`);
              await prisma.business.upsert({
                  where: { id: businessId },
                  update: {
                      name: `Business ${businessId.slice(0, 8)}`,
                  },
                  create: {
                      id: businessId,
                      name: `Business ${businessId.slice(0, 8)}`,
                      license: {
                          create: {
                              planName,
                              validUntil: new Date(validUntil),
                              status,
                              signature,
                              supportPin: Math.random().toString(36).slice(2, 8).toUpperCase(),
                              type: 'on-premise',
                          }
                      }
                  }
              });
          } else if (business.license) {
              // Actualizar licencia existente
              await prisma.license.update({
                  where: { businessId },
                  data: {
                      planName,
                      validUntil: new Date(validUntil),
                      status,
                      signature,
                  }
              });
          } else {
              // Empresa existe pero sin licencia, crear licencia
              await prisma.license.create({
                  data: {
                      planName,
                      validUntil: new Date(validUntil),
                      status,
                      signature,
                      supportPin: Math.random().toString(36).slice(2, 8).toUpperCase(),
                      type: 'on-premise',
                      businessId,
                  }
              });
          }

          // Actualiza la sesión activa del usuario para extender vigencia
          await prisma.session.updateMany({
              where: { user: { businessId: businessId } },
              data: { updatedAt: new Date(), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }
          });

          logger.info(`[LICENSE] Licencia actualizada correctamente para businessId: ${businessId} — Plan: ${planName} — Status: ${status}`);
          res.json({ success: true, message: "Licencia actualizada correctamente" });

      } catch (error: any) {
          logger.error('[LICENSE] Error actualizando licencia', { error: error.message });
          res.status(500).json({ error: "Error interno al actualizar licencia" });
      }
  });

  // ==========================================
  // 👔 ADMIN / PROVISIONING / AUDIT LOGS
  // ==========================================
  app.get("/api/v1/admin/audit-logs", async (req, res) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as unknown as HeadersInit
      });
      if (!session || !session.user) return res.status(401).json({ error: "No autorizado" });
      
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.role !== 'admin') return res.status(403).json({ error: "Acceso denegado (Solo Admins)" });

      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      res.json(logs);
    } catch (error) {
      logger.error('Error obteniendo logs de auditoría', { error });
      res.status(500).json({ error: "Error interno" });
    }
  });

  app.post("/api/v1/admin/provision", async (req, res) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as unknown as HeadersInit
      });
      if (!session || !session.user) return res.status(401).json({ error: "No autorizado" });
      
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.role !== 'admin') return res.status(403).json({ error: "Acceso denegado (Solo Admins)" });

      const { clientName, deploymentType, databaseUrl } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

      // Record Audit
      await prisma.auditLog.create({
        data: {
          action: "PROVISION_CLIENT",
          details: JSON.stringify({ clientName, deploymentType }),
          userId: user.id,
          userEmail: user.email,
          ipAddress
        }
      });

      let envContent = '';
      let composeContent = '';

      if (deploymentType === 'railway') {
        envContent = `DATABASE_URL="${databaseUrl || 'postgresql://postgres:password@db:5432/nexus'}"\nHOSTING_TYPE="railway"\nNODE_ENV="production"\nPORT=3000\nSENTRY_DSN_BACKEND=""`;
      } else {
        envContent = `DATABASE_URL="${databaseUrl || 'postgresql://postgres:password@localhost:5432/nexus'}"\nHOSTING_TYPE="on-premise"\nNODE_ENV="production"\nPORT=3000\nSENTRY_DSN_BACKEND=""`;
        composeContent = `version: '3.8'
services:
  app:
    image: nexus-solutions:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - HOSTING_TYPE=on-premise
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: nexus
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

volumes:
  pgdata:`;
      }

      res.json({ env: envContent, dockerCompose: composeContent });
    } catch (error) {
      logger.error('Error generando provisioning', { error });
      res.status(500).json({ error: "Error interno" });
    }
  });

  // ==========================================
  // ⚡ VITE MIDDLEWARE (Frontend)
  // ==========================================
  
  if (process.env.NODE_ENV !== "production") {
    // Modo de desarrollo: Vite compila en caliente
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Modo de producción: Se sirven los archivos estáticos de /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Monitor de Errores de Sentry (Se añade casi al final, antes de la escucha del puerto)
  Sentry.setupExpressErrorHandler(app);

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 Servidor Nexus corriendo en http://0.0.0.0:${PORT}`);
  });

  // Iniciamos el servicio de telemetría (se encargará de todo si es On-Premise)
  startTelemetryPing();

  // ==========================================
  // 🛑 GRACEFUL SHUTDOWN (Cierre Seguro)
  // ==========================================
  // Si Docker o el SO manda una señal de apagado, cerramos la BD y las peticiones en curso ordenadamente.
  const shutdown = async (signal: string) => {
    logger.info(`Se recibió la señal ${signal}. Iniciando apagado seguro (Graceful Shutdown)...`);
    server.close(async () => {
      logger.info('Servidor HTTP cerrado. Desconectando Base de Datos...');
      await prisma.$disconnect();
      logger.info('Base de Datos desconectada. Proceso finalizado.');
      process.exit(0);
    });
    
    // Fallback: Si después de 10 segundos no se pudo cerrar limpiamente, lo forzamos
    setTimeout(() => {
      logger.error('No se pudo cerrar limpiamente a tiempo. Forzando cierre.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
