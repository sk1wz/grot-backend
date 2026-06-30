# Очереди BullMQ (Checks)

Документ описывает, как устроены очереди проверок в проекте, что означают ключи в Redis и какие методы участвуют в flow.

## Где это в коде

```
src/queue/
  queue.module.ts              # Nest-модуль: processors + CheckQueueService
  check/
    check-bull.module.ts       # BullModule.forRoot + registerQueue
    check-queue.constants.ts   # имена очередей, типы job
    check-queue.service.ts     # producer: enqueueSubmit / enqueueSync
    check.processors.ts        # consumer: worker для каждой очереди

src/check/
  check.service.ts             # createCheck, submit, sync — бизнес-логика
```

Подключение:

```
AppModule → CheckModule → QueueModule → CheckBullModule
```

Redis: один сервер (`REDIS_URI`), разные префиксы ключей.

---

## Очереди в проекте

| Модуль проверки | Имя очереди Redis | Processor |
|-----------------|-------------------|-----------|
| GIBDD | `checks-gibdd` | `GibddCheckProcessor` |
| GISTORGI | `checks-gistorgi` | `GistorgiCheckProcessor` |
| FSSP | `checks-fssp` | `FsspCheckProcessor` |
| BANKRUPTCY | `checks-bankruptcy` | `BankruptcyCheckProcessor` |

Полный ключ в Redis всегда с префиксом Bull:

```
bull:{имя-очереди}:{суффикс}
```

Пример: `bull:checks-gistorgi:meta`

---

## Что ты видишь в Redis Insight

### Ключи Bull (очереди)

| Ключ | Тип | TTL | Назначение |
|------|-----|-----|------------|
| `bull:checks-gistorgi:meta` | Hash | нет | Метаданные очереди (версия, opts, счётчики) |
| `bull:checks-gistorgi:id` | String | нет | Автоинкремент ID job (служебный счётчик) |
| `bull:checks-gistorgi:events` | Stream | ~10 KB max | События очереди (added, completed, failed…) для UI/мониторинга |
| `bull:checks-gistorgi:stalled-check` | String | **~12 s** | Служебный ключ: worker периодически проверяет «зависшие» job |
| `bull:checks-gistorgi:1` | Hash | зависит от job | Данные конкретного job (пока job живёт в Redis) |
| `bull:checks-gistorgi:wait` | List | нет | Job, ожидающие обработки |
| `bull:checks-gistorgi:delayed` | ZSet | нет | Job с delay (sync-check через 5 сек) |
| `bull:checks-gistorgi:active` | List | нет | Job, которые worker сейчас выполняет |
| `bull:checks-gistorgi:completed` | ZSet | нет | Завершённые (у нас `removeOnComplete: true` — быстро исчезают) |
| `bull:checks-gistorgi:failed` | ZSet | нет | Упавшие job (храним до 100 штук) |

> Не все ключи видны одновременно: `wait`, `delayed`, `active` появляются только когда есть job в этом состоянии.

### `stalled-check` и TTL 12 s

Worker BullMQ раз в несколько секунд ставит короткоживущий ключ `stalled-check`. Если worker упал посреди job, механизм **stalled** вернёт job в очередь. TTL ~12 s — это нормально, ключ не «данные пользователя», а служебный heartbeat.

### `meta`, `id`, `events`

- **meta** — конфиг очереди (имя, версия Bull, настройки).
- **id** — последний выданный числовой ID job.
- **events** — stream событий для Bull Board / отладки.

### Ключи сессий (не Bull)

```
sessions:xugZG1SLupUDX0oQ-xuDdoeYeWS6AaM9
```

Это **express-session** + RedisStore из `main.ts`. Префикс задаётся `SESSION_FOLDER` в `.env`. К сессиям очередь не относится — они просто лежат в том же Redis.

---

## Типы job

| Job name | Константа | Кто ставит | Что делает worker |
|----------|-----------|------------|-------------------|
| `submit-check` | `CHECK_SUBMIT_JOB` | `enqueueSubmit` после `createCheck` | POST в Stormfinder |
| `sync-check` | `CHECK_SYNC_JOB` | `enqueueSync` после submit / после sync | GET статуса Stormfinder |

Данные job:

```typescript
{ checkId: string }
```

---

## Полный flow (single)

```
1. POST /checks/gistorgi
       ↓
2. CheckService.createCheck()
       • транзакция: баланс + Check (PENDING)
       • CheckQueueService.enqueueSubmit(module, checkId)
       ↓
3. Redis: job submit-check в bull:checks-gistorgi:wait
       ↓
4. GistorgiCheckProcessor.process()
       • CheckService.submitCheckToStormfinder(checkId)
       • POST Stormfinder → serviceId, status QUEUED/RUNNING
       • enqueueSync(module, checkId) с delay 5 сек
       ↓
5. Redis: job sync-check в bull:checks-gistorgi:delayed
       ↓
6. GistorgiCheckProcessor.process()
       • CheckService.syncCheckById(checkId)
       • GET Stormfinder
       • если ещё RUNNING → снова enqueueSync
       • если DONE/FAILED → job больше не ставится
```

HTTP отвечает **202** сразу после шага 2. Шаги 3–6 идут в фоне.

---

## Методы producer — `CheckQueueService`

Файл: `src/queue/check/check-queue.service.ts`

### `enqueueSubmit(module, checkId)`

Кладёт job **отправки** проверки в Stormfinder.

```typescript
await queue.add('submit-check', { checkId }, {
  jobId: checkId,              // один check = один submit job
  removeOnComplete: true,      // после успеха job удаляется из Redis
  removeOnFail: 100,           // последние 100 failed хранятся для отладки
  attempts: 3,                 // до 3 попыток при ошибке
  backoff: {
    type: 'exponential',
    delay: 5_000,              // 5s, 10s, 20s…
  },
});
```

Вызывается из: `CheckService.createCheck()` после успешной транзакции в БД.

### `enqueueSync(module, checkId)`

Кладёт job **опроса статуса** с задержкой 5 секунд.

```typescript
await queue.add('sync-check', { checkId }, {
  jobId: `sync-${checkId}`,    // без двоеточия! Bull запрещает : в jobId
  delay: CHECK_SYNC_DELAY_MS,  // 5000 ms
  removeOnComplete: true,
  removeOnFail: 100,
});
```

Вызывается из:

- `CheckService.submitCheckToStormfinder()` — если Stormfinder вернул QUEUED/RUNNING
- `CheckService.syncCheckById()` — если проверка ещё не в терминальном статусе
- `CheckService.syncCheckById()` — при ошибке GET (повтор через 5 сек)

---

## Методы consumer — Processors

Файл: `src/queue/check/check.processors.ts`

Каждый `@Processor(CHECK_QUEUES.…)` — отдельный worker на свою очередь.

### `process(job)`

```typescript
switch (job.name) {
  case 'submit-check':
    await checkService.submitCheckToStormfinder(job.data.checkId);
    break;
  case 'sync-check':
    await checkService.syncCheckById(job.data.checkId);
    break;
}
```

По умолчанию **concurrency = 1** — один job за раз на очередь.

---

## Методы бизнес-логики — `CheckService`

| Метод | Роль |
|-------|------|
| `createCheck()` | HTTP → БД → `enqueueSubmit` |
| `submitCheckToStormfinder()` | Worker submit: POST Stormfinder → `enqueueSync` |
| `syncCheckById()` | Worker sync: GET Stormfinder → повторный `enqueueSync` или стоп |
| `refundAndFailCheck()` | Ошибка submit → refund + FAILED |

---

## Настройка Bull

Файл: `src/queue/check/check-bull.module.ts`

```typescript
BullModule.forRootAsync({
  connection: { url: REDIS_URI },
});

BullModule.registerQueue(
  { name: 'checks-gibdd' },
  { name: 'checks-gistorgi' },
  { name: 'checks-fssp' },
  { name: 'checks-bankruptcy' },
);
```

---

## Env

```env
REDIS_URI=redis://:password@localhost:6379
SESSION_FOLDER=sessions:    # сессии, не bull
```

---

## Жизненный цикл job в Redis

```
add()  →  wait (или delayed, если delay)
           ↓
        active (worker взял)
           ↓
     completed / failed
           ↓
   removeOnComplete → ключ job удалён
```

При **10 одновременных** POST в gistorgi:

- 10 job в `wait` (или по одному в `active`, если concurrency=1)
- submit обрабатываются **последовательно**
- sync job у каждого check свой, с delay, в `delayed`

---

## Отладка

### Посмотреть job в Redis CLI

```bash
redis-cli
KEYS bull:checks-gistorgi:*
LRANGE bull:checks-gistorgi:wait 0 -1
```

### Типичные проблемы

| Симптом | Причина |
|---------|---------|
| `Custom Id cannot contain :` | В `jobId` был `sync:uuid` — исправлено на `sync-uuid` |
| Check в PENDING навсегда | Worker не запущен / Redis недоступен |
| Check в RUNNING навсегда | sync job не ставится или worker упал |
| Много ключей `bull:*` | Нормально; completed удаляются при `removeOnComplete: true` |

### Bull Board (опционально)

Для UI мониторинга можно подключить `@bull-board/nestjs` — не настроено в проекте, но `events` stream уже есть под это.

---

## Схема: Redis namespaces

```
Redis
├── sessions:*              ← express-session (main.ts)
└── bull:
    ├── checks-gibdd:*
    ├── checks-gistorgi:*
    ├── checks-fssp:*
    └── checks-bankruptcy:*
```

Один Redis, разные «папки» по префиксу. Сессии и очереди **не пересекаются**.
