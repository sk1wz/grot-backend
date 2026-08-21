import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './__generated__/client';
import { CheckModuleEnums } from './__generated__/enums';

const PRICES = [
  {
    module: CheckModuleEnums.GIBDD,
    title: 'ГИБДД',
    description: 'Проверка автомобиля по базе ГИБДД',
    price: 50,
  },
  {
    module: CheckModuleEnums.LIMITATION,
    title: 'Ограничения регистрации',
    description: 'Проверка ограничений на регистрационные действия автомобиля',
    price: 5,
  },
  {
    module: CheckModuleEnums.GISTORGI,
    title: 'ГИС Торги',
    description: 'Проверка по базе государственных торгов',
    price: 5,
  },
  {
    module: CheckModuleEnums.FSSP,
    title: 'ФССП',
    description: 'Проверка исполнительных производств ФССП',
    price: 5,
  },
  {
    module: CheckModuleEnums.BANKRUPTCY,
    title: 'Банкротство',
    description: 'Проверка сведений о банкротстве',
    price: 5,
  },
  {
    module: CheckModuleEnums.INN,
    title: 'ИНН',
    description: 'Проверка по ИНН',
    price: 5,
  },
  {
    module: CheckModuleEnums.TAXI,
    title: 'Проверка такси',
    description: 'Проверка ТС в реестре такси по VIN',
    price: 5,
  },
] as const;

async function main(): Promise<void> {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI не задан в .env');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URI }),
  });

  try {
    for (const row of PRICES) {
      await prisma.checkPrice.upsert({
        where: { module: row.module },
        create: row,
        update: {
          title: row.title,
          description: row.description,
          price: row.price,
        },
      });
    }

    const rows = await prisma.checkPrice.findMany({
      orderBy: { module: 'asc' },
    });

    console.log('В таблице check_prices:', rows);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
