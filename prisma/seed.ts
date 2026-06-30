import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './__generated__/client';
import { CheckModuleEnums } from './__generated__/enums';

const PRICES = [
  { module: CheckModuleEnums.GIBDD, price: 50 },
  { module: CheckModuleEnums.GISTORGI, price: 10 },
  { module: CheckModuleEnums.FSSP, price: 10 },
  { module: CheckModuleEnums.BANKRUPTCY, price: 10 },
  { module: CheckModuleEnums.INN, price: 10 },
] as const;

async function main(): Promise<void> {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI не задан в .env');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URI }),
  });

  try {
    const { count } = await prisma.checkPrice.createMany({
      data: [...PRICES],
      skipDuplicates: true,
    });

    const rows = await prisma.checkPrice.findMany({
      orderBy: { module: 'asc' },
    });

    console.log(`Добавлено новых цен: ${count}`);
    console.log('В таблице check_prices:', rows);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
