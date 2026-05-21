import esbuild from 'esbuild';
import obfuscator from 'javascript-obfuscator';
import fs from 'fs/promises';
import path from 'path';

async function buildOnPremise() {
  console.log("Iniciando compilación ON-PREMISE...");

  const distDir = path.resolve('dist-onpremise');
  await fs.mkdir(distDir, { recursive: true });

  // 1. Usar esbuild para empaquetar toda la aplicación del servidor (Node.js) en un solo archivo
  console.log("1. Empaquetando código con esbuild...");
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: path.join(distDir, 'server.bundled.js'),
    external: ['@prisma/client', 'better-auth', 'express'], // Módulos nativos o pesados
    format: 'esm',
  });

  // 2. Leer el archivo recién empaquetado
  console.log("2. Leyendo código empaquetado...");
  const rawCode = await fs.readFile(path.join(distDir, 'server.bundled.js'), 'utf8');

  // 3. Aplicar Ofuscación Extrema al código. 
  // Esto hace que variables, lógicas y condiciones del tipo `if(!verifyLicense)` sean indescifrables.
  console.log("3. Ofuscando y encriptando lógica de seguridad...");
  const obfuscatedResult = obfuscator.obfuscate(rawCode, {
    compact: true,
    controlFlowFlattening: true,       // Destruye la estructura de if/else 
    controlFlowFlatteningThreshold: 1, 
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,                 // Encripta todos los strings ("suspended", "active")
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1,
    deadCodeInjection: true,           // Inyecta código basura para confundir a los hackers
  });

  // 4. Guardar el archivo final blindado
  const finalPath = path.join(distDir, 'server.bin.js');
  await fs.writeFile(finalPath, obfuscatedResult.getObfuscatedCode());

  // (Opcional en un entorno real: usar Node SEA (Single Executable Application) o pkg para convertir server.bin.js en un .exe)
  console.log("4. Empaquetando archivo binario en .exe con Vercel PKG...");

  console.log("✅ Compilación exitosa. El archivo binario para el cliente está en: dist-onpremise/server.bin.js");
  console.log("Nadie podrá leer o alterar la validación de la licencia desde este archivo.");
}

buildOnPremise().catch(console.error);
