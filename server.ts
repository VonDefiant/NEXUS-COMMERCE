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
  // 🔧 HELPER - obtener businessId del usuario
  // ==========================================
  async function getBusinessId(req: express.Request): Promise<string | null> {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session?.user) return null;
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    return process.env.NEXUS_BUSINESS_ID || user?.businessId || null;
  }

  // ==========================================
  // 📦 CATEGORÍAS
  // ==========================================
  app.get('/api/v1/categories', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const categories = await prisma.category.findMany({ where: { businessId }, orderBy: { name: 'asc' } });
    res.json(categories);
  });
  app.post('/api/v1/categories', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const category = await prisma.category.create({ data: { name: name.trim(), color: color || '#6366f1', businessId } });
    res.json(category);
  });
  app.put('/api/v1/categories/:id', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { name, color } = req.body;
    const category = await prisma.category.update({ where: { id: req.params.id }, data: { name, color } });
    res.json(category);
  });
  app.delete('/api/v1/categories/:id', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // ==========================================
  // 🏢 PROVEEDORES
  // ==========================================
  app.get('/api/v1/suppliers', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const suppliers = await prisma.supplier.findMany({ where: { businessId, isActive: true }, orderBy: { name: 'asc' } });
    res.json(suppliers);
  });
  app.post('/api/v1/suppliers', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { name, contact, phone, email, address, nit } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const supplier = await prisma.supplier.create({ data: { name: name.trim(), contact, phone, email, address, nit, businessId } });
    res.json(supplier);
  });
  app.put('/api/v1/suppliers/:id', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { name, contact, phone, email, address, nit, isActive } = req.body;
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: { name, contact, phone, email, address, nit, isActive } });
    res.json(supplier);
  });
  app.delete('/api/v1/suppliers/:id', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  });

  // ==========================================
  // 👥 CLIENTES
  // ==========================================
  app.get('/api/v1/customers', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const customers = await prisma.customer.findMany({ where: { businessId, isActive: true }, orderBy: { name: 'asc' } });
    res.json(customers);
  });
  app.post('/api/v1/customers', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { name, nit, phone, email, address, creditLimit } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const customer = await prisma.customer.create({ data: { name: name.trim(), nit, phone, email, address, creditLimit: creditLimit || 0, businessId } });
    res.json(customer);
  });
  app.put('/api/v1/customers/:id', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { name, nit, phone, email, address, creditLimit, isActive } = req.body;
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data: { name, nit, phone, email, address, creditLimit, isActive } });
    res.json(customer);
  });

  // ==========================================
  // 🛒 VENTAS (nuevo modelo Sale)
  // ==========================================
  app.get('/api/v1/sales', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const sales = await prisma.sale.findMany({
      where: { businessId },
      include: { customer: true, items: { include: { product: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(sales);
  });

  app.post('/api/v1/sales', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const session = await auth.api.getSession({ headers: req.headers as any });
    const { items, customerId, discount, tax, notes, amountPaid, status, branchId } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'La venta debe tener al menos un producto' });

    // Calcular totales
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity - (item.discount || 0);
    }
    const total = subtotal + (tax || 0) - (discount || 0);

    // Generar número de venta
    const count = await prisma.sale.count({ where: { businessId } });
    const number = `NV-${String(count + 1).padStart(4, '0')}`;

    const sale = await prisma.sale.create({
      data: {
        number, status: status || 'completed', subtotal, discount: discount || 0,
        tax: tax || 0, total, amountPaid: amountPaid || total,
        notes, customerId: customerId || null, businessId,
        branchId: branchId || null, userId: session!.user.id,
        items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount || 0, subtotal: i.price * i.quantity - (i.discount || 0) })) },
        ...(amountPaid > 0 && { payments: { create: [{ amount: amountPaid, method: 'cash' }] } })
      },
      include: { items: true }
    });

    // Descontar stock y registrar movimiento
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        await prisma.stockMovement.create({ data: { productId: item.productId, type: 'out', quantity: item.quantity, reason: 'sale', refId: sale.id, before: product.stock, after: product.stock - item.quantity, userId: session!.user.id } });
      }
    }

    // Actualizar balance del cliente si es crédito
    if (customerId && status === 'credit') {
      await prisma.customer.update({ where: { id: customerId }, data: { balance: { increment: total - (amountPaid || 0) } } });
    }

    res.json(sale);
  });

  // ==========================================
  // 📦 COMPRAS
  // ==========================================
  app.get('/api/v1/purchases', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const purchases = await prisma.purchase.findMany({
      where: { businessId },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(purchases);
  });

  app.post('/api/v1/purchases', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const { supplierId, items, tax, notes } = req.body;
    if (!supplierId) return res.status(400).json({ error: 'Proveedor requerido' });
    if (!items?.length) return res.status(400).json({ error: 'La compra debe tener al menos un producto' });

    let subtotal = 0;
    for (const item of items) subtotal += item.cost * item.quantity;
    const total = subtotal + (tax || 0);
    const count = await prisma.purchase.count({ where: { businessId } });
    const number = `OC-${String(count + 1).padStart(4, '0')}`;

    const purchase = await prisma.purchase.create({
      data: {
        number, status: 'pending', supplierId, businessId, subtotal, tax: tax || 0, total, notes,
        items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, cost: i.cost, subtotal: i.cost * i.quantity })) }
      },
      include: { items: true }
    });
    res.json(purchase);
  });

  app.patch('/api/v1/purchases/:id/receive', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const session = await auth.api.getSession({ headers: req.headers as any });
    const purchase = await prisma.purchase.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' });

    // Actualizar stock al recibir
    for (const item of purchase.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, cost: item.cost } });
        await prisma.stockMovement.create({ data: { productId: item.productId, type: 'in', quantity: item.quantity, reason: 'purchase', refId: purchase.id, before: product.stock, after: product.stock + item.quantity, userId: session!.user.id } });
      }
    }

    const updated = await prisma.purchase.update({ where: { id: req.params.id }, data: { status: 'received', receivedAt: new Date() } });
    res.json(updated);
  });

  // ==========================================
  // 💰 GASTOS
  // ==========================================
  app.get('/api/v1/expenses', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const expenses = await prisma.expense.findMany({ where: { businessId }, orderBy: { date: 'desc' }, take: 100 });
    res.json(expenses);
  });

  app.post('/api/v1/expenses', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const session = await auth.api.getSession({ headers: req.headers as any });
    const { description, category, amount, date } = req.body;
    if (!description?.trim() || !amount || !category) return res.status(400).json({ error: 'Descripción, categoría y monto requeridos' });
    const expense = await prisma.expense.create({ data: { description: description.trim(), category, amount: parseFloat(amount), date: date ? new Date(date) : new Date(), businessId, userId: session!.user.id } });
    res.json(expense);
  });

  app.delete('/api/v1/expenses/:id', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  // ==========================================
  // 📊 INVENTARIO - Movimientos (Kardex)
  // ==========================================
  app.get('/api/v1/inventory/movements', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const movements = await prisma.stockMovement.findMany({
      where: { product: { businessId } },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(movements);
  });

  app.post('/api/v1/inventory/adjust', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    const session = await auth.api.getSession({ headers: req.headers as any });
    const { productId, quantity, reason } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    const newStock = product.stock + quantity;
    if (newStock < 0) return res.status(400).json({ error: 'Stock no puede ser negativo' });
    await prisma.product.update({ where: { id: productId }, data: { stock: newStock } });
    await prisma.stockMovement.create({ data: { productId, type: 'adjustment', quantity, reason: reason || 'adjustment', before: product.stock, after: newStock, userId: session!.user.id } });
    res.json({ success: true, newStock });
  });

  // Stock bajo mínimo
  app.get('/api/v1/inventory/alerts', async (req, res) => {
    const businessId = await getBusinessId(req);
    if (!businessId) return res.status(401).json({ error: 'No autorizado' });
    // @ts-ignore - Ignore exact types since we use raw prisma
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, sku: true, stock: true, minStock: true, category: { select: { name: true, color: true } } }
    });
    const alerts = products.filter((p: any) => p.stock <= p.minStock);
    res.json(alerts);
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
