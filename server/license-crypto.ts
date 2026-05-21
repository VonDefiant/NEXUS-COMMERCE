import * as crypto from 'crypto';

// Esta llave es el SECRETO MAESTRO DE NEXUS SOLUTIONS.
// Nunca se le debe entregar al cliente. En producción esto vivirá en las variables de entorno (.env).
const NEXUS_MASTER_KEY = process.env.NEXUS_LICENSE_SECRET;

if (!NEXUS_MASTER_KEY) {
    console.warn("ADVERTENCIA CRÍTICA: NEXUS_LICENSE_SECRET no está definido en las variables de entorno. La firma de licencias fallará.");
}

/**
 * Función exclusiva de NEXUS SOLUTIONS.
 * Genera una firma criptográfica única e irrepetible para los datos de esa licencia.
 */
export function generateLicenseSignature(businessId: string, planName: string, validUntil: Date | string, status: string) {
    if (!NEXUS_MASTER_KEY) {
        throw new Error("NEXUS_LICENSE_SECRET no está configurado. No se pueden generar firmas.");
    }

    // 1. Empaqueta los datos que el cliente "podría" querer alterar
    const validUntilStr = validUntil instanceof Date ? validUntil.toISOString() : new Date(validUntil).toISOString();
    const payload = `${businessId}:${planName}:${validUntilStr}:${status}`;
    
    // 2. Hashea/Firma los datos usando HMAC-SHA256 y la llave que solo Nexus tiene
    return crypto.createHmac('sha256', NEXUS_MASTER_KEY).update(payload).digest('hex');
}

/**
 * Función que corre en el Servidor On-Premise del Cliente.
 * Valida si los datos de la base de datos no han sido adulterados manualmente.
 */
export function verifyLicenseIntegrity(license: any): boolean {
    if (!license || !license.signature) return false;

    // Calculamos qué firma deberían tener los datos actuales de la Base de Datos
    const expectedSignature = generateLicenseSignature(
        license.businessId,
        license.planName,
        license.validUntil,
        license.status
    );

    // Si la firma matemática generada no coincide con la guardada en la Base de Datos
    // significa que alguien alteró la fecha o el estado manualmente.
    return expectedSignature === license.signature;
}
