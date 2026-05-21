import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // need to handle lack of uuid. actually, we don't need uuid if id is auto via @default(uuid()) for other models, but user id comes from BetterAuth usually so we assign it.

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
  await prisma.license.create({
    data: {
      status: 'active',
      type: 'cloud',
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 año desde hoy
      supportPin: Math.random().toString(36).slice(2, 8).toUpperCase(),
      planName: 'Nexus Core PRO',
      businessId: business.id,
    },
  });

  console.log('🌱 Seed: Creando Cuenta de Administrador...');
  const adminUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      name: 'Usuario Admin',
      email: 'admin@nexus.com',
      emailVerified: true,
      image: 'https://picsum.photos/seed/avatar1/100/100',
      role: 'admin',
      businessId: business.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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
