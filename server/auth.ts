import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || (() => {
        console.error("[FATAL] BETTER_AUTH_SECRET no configurada");
        return "INSECURE-CHANGE-ME-" + Date.now();
    })(),
    // Evitaremos que el warning "Base URL could not be determined" tire error
    baseURL: process.env.VITE_APP_URL || "http://localhost:3000",
    basePath: "/api/auth",
    // trustedOrigins dinámico — no hardcodeado
    trustedOrigins: process.env.NODE_ENV === "production" && process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").filter(Boolean)
        : ["*"],
    trustHost: true,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [bearer()],
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        sendResetPassword: async ({ user, url }, request) => {
            if (!process.env.RESEND_API_KEY) {
                console.log("[AUTH] No RESEND_API_KEY. Reset URL:", url);
                return;
            }
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: process.env.EMAIL_FROM_ADDRESS || 'soporte@nexus.com',
                    to: user.email,
                    subject: 'Recuperación de contraseña - Nexus Solutions',
                    html: `<p>Hola ${user.name},</p><p>Haz clic <a href="${url}">aquí</a> para restablecer tu contraseña.</p>`
                });
            } catch (error) {
                console.error("[AUTH] Error enviando correo:", error);
            }
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "lax",    // "none" era bloqueado por Chrome en iframes
            secure: false,      // false permite HTTP y HTTPS
            httpOnly: true,
            path: "/",
        },
    }
});
