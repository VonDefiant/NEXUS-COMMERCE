import { PrismaClient } from '@prisma/client';
import { auth } from '../server/auth.ts';

import { generateLicenseSignature } from '../server/license-crypto.ts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed: Limpiando base de datos...');
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.license.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  console.log('🌱 Seed: Creando Empresa Nexus...');
  const business = await prisma.business.create({
    data: {
      name: 'Ferretería El Martillo (Nexus Demo)',
      logoUrl: null,
    },
  });

  console.log('🌱 Seed: Creando Licencia Activa...');
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 año desde hoy
  
  // Generar la firma para la semilla usando la misma lógica
  const signature = generateLicenseSignature(business.id, 'Nexus Core PRO', validUntil, 'active');

  await prisma.license.create({
    data: {
      status: 'active',
      type: 'cloud',
      validUntil: validUntil,
      supportPin: Math.random().toString(36).slice(2, 8).toUpperCase(),
      planName: 'Nexus Core PRO',
      businessId: business.id,
      signature: signature,
    },
  });

  console.log('🌱 Seed: Creando Cuenta de Administrador...');
  const { user } = await auth.api.signUpEmail({
    body: {
      email: 'admin@nexus.com',
      password: 'Nexus2024!',
      name: 'Usuario Admin'
    }
  });
  
  // Luego actualizar el rol y businessId:
  const adminUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin', businessId: business.id }
  });

  console.log('🌱 Seed: Añadiendo Catálogo de Productos y Transacciones...');
  
  const productA = await prisma.product.create({
    data: {
      name: 'Taladro Percutor Bosch 800W',
      sku: 'TBS-800',
      price: 120.50,
      stock: 15,
      businessId: business.id,
    }
  });

  const productB = await prisma.product.create({
    data: {
      name: 'Set de Llaves Combinadas 12pz',
      sku: 'LLC-12',
      price: 45.00,
      stock: 40,
      businessId: business.id,
    }
  });

  await prisma.transaction.createMany({
    data: [
      {
        type: 'sale',
        quantity: 2,
        totalAmount: 241.00,
        productId: productA.id,
        businessId: business.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
      },
      {
        type: 'sale',
        quantity: 1,
        totalAmount: 45.00,
        productId: productB.id,
        businessId: business.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
      }
    ]
  });

  console.log('✅ Base de datos instanciada y lista!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
