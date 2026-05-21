import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.ts';
import os from 'os';

const prisma = new PrismaClient();

console.log('[TELEMETRY] NEXUS_CLOUD_URL:', process.env.NEXUS_CLOUD_URL ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('[TELEMETRY] NEXUS_TELEMETRY_SECRET:', process.env.NEXUS_TELEMETRY_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO');

if (!process.env.NEXUS_TELEMETRY_SECRET) {
    logger.warn('[TELEMETRY] NEXUS_TELEMETRY_SECRET no configurado. Los pings serán rechazados por el Master.');
}

export async function sendTelemetryPing() {
    const NEXUS_CLOUD_URL = process.env.NEXUS_CLOUD_URL || '';
    const NEXUS_TELEMETRY_SECRET = process.env.NEXUS_TELEMETRY_SECRET || '';

    if (!NEXUS_CLOUD_URL) return;

    try {
        const business = await prisma.business.findFirst({
            orderBy: { updatedAt: 'desc' },
            include: {
                license: true,
                _count: { select: { users: true, branches: true } }
            }
        });

        if (!business) {
            logger.warn('[TELEMETRY] No hay empresas registradas, cancelando ping.');
            return;
        }

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const ramUsage = totalMem > 0 ? ((totalMem - freeMem) / totalMem) * 100 : 0;
        const cpuLoad = os.loadavg()[0] || 0;

        let dbSize = 'Unknown';
        try {
            const result: any = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`;
            if (result?.[0]?.size) dbSize = String(result[0].size);
        } catch { /* ignore */ }

        const payload = {
            businessId: process.env.NEXUS_BUSINESS_ID || business.id,  // Priorizar el ID del Master
            businessName: business.name,
            planName: business.license?.planName || 'Unknown',
            userCount: business._count.users,
            branchCount: business._count.branches,
            signature: business.license?.signature || 'none',
            hostingType: process.env.HOSTING_TYPE || 'on-premise',
            cpuLoad,
            ramUsage,
            dbSize
        };

        const targetUrl = `${NEXUS_CLOUD_URL}/api/v1/telemetry/ping`;

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-nexus-telemetry-secret': NEXUS_TELEMETRY_SECRET
            },
            body: JSON.stringify(payload)
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
            logger.info(`[TELEMETRY] Ping enviado exitosamente a Master (Usuarios: ${payload.userCount})`);
        } else {
            logger.warn(`[TELEMETRY] Ping fallido / Interceptado por proxy. Status: ${response.status}`);
        }
    } catch (error: any) {
        logger.error('[TELEMETRY] Error de conexión enviando ping.', { error: error.message });
    }
}

export function startTelemetryPing() {
    const NEXUS_CLOUD_URL = process.env.NEXUS_CLOUD_URL || '';
    
    // Si no está configurada la URL de la nube, asumimos que este servidor ES la nube,
    // o simplemente no queremos emitir telemetría.
    if (!NEXUS_CLOUD_URL) {
        logger.info('📡 Telemetría: NEXUS_CLOUD_URL no está configurado. No se emitirán pings de telemetría desde este servidor.');
        return;
    }

    // Ping inmediato al arrancar (para verificar conectividad)
    logger.info('[TELEMETRY] Enviando ping inicial al Master Hub...');
    sendTelemetryPing().catch(err => {
        logger.error('[TELEMETRY] Error en el ping inicial', { error: err.message });
    });

    // También enviar cada 6 horas en addition al cron de 02:00 AM
    setInterval(async () => {
        await sendTelemetryPing();
    }, 6 * 60 * 60 * 1000);

    // Cron job: Correr todos los días a las 02:00 AM
    cron.schedule('0 2 * * *', sendTelemetryPing);

    logger.info('📡 Servicio de Telemetría On-Premise activado.');
}
