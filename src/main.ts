import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { parseTime } from './utils/parse-time';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { createClient } from 'redis';
import session from 'express-session';
import { RedisStore } from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // app.setGlobalPrefix('api');

  const redis = createClient({ url: config.getOrThrow('REDIS_URI') });
  await redis.connect();
  app.use(cookieParser(config.getOrThrow('COOKIES_SECRET')));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      resave: true,
      saveUninitialized: false,
      cookie: {
        domain: config.getOrThrow<string>('SESSION_DOMAIN'),
        maxAge: parseTime(config.getOrThrow<string>('SESSION_MAX_AGE')),
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      },
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
      }),
    }),
  );

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}
void bootstrap();
