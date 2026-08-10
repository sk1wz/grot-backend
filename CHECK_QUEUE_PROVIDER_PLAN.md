# План: очередь и обработчики провайдеров

## Результат

`CheckService` не знает о Stormfinder и не выполняет HTTP-запросы. После создания `Check` он делает только:

```text
transaction: balance debit + Check(PENDING, provider)
→ enqueue submit-check(checkId)
→ HTTP 202
```

Дальше проверкой управляет очередь.

```text
submit-check → Provider handler.submit(Check)
             → serviceId/status/result в БД
             → sync-check через 3–5 сек, пока проверка активна

sync-check   → Provider handler.poll(Check)
             → обновить БД
             → снова sync-check либо завершить
```

## Принятые решения

- У каждого провайдера есть собственный **формирователь внешнего запроса** рядом с handler-ом. Для Stormfinder это `stormfinder.request-builder.ts`.
- Builder получает целиком сохранённый `Check`, берёт значения из `subjectBody` и возвращает `{ path, body }` в контракте конкретного провайдера.
- `CheckService` не формирует внешний HTTP body и не хранит адреса Stormfinder.
- В `CheckService` есть единый публичный `failCheck(check, error, providerResult?)`. Он транзакционно ставит `FAILED`, сохраняет error (и `serviceId`, если его уже вернул провайдер), возвращает баланс ровно один раз и отправляет terminal websocket event.
- Временная ошибка polling-а не вызывает `failCheck`: polling ставится в очередь повторно. Terminal `failed` от провайдера и окончательная ошибка submit вызывают `failCheck`.

## 1. Что оставить из текущей очереди

Переиспользовать без создания очереди на каждый модуль:

- очередь `checks-single`;
- job `submit-check`;
- job `sync-check`;
- `CheckQueueService.enqueueSubmit`, `enqueueSync`, `ensureSubmit`, `ensureSync`;
- `QueueRecoveryService`: на старте он вернёт в очередь `PENDING` и активные проверки.

Данные job оставлять минимальными:

```ts
type CheckJobData = { checkId: string };
```

Все исходные данные, provider, модуль и `serviceId` берутся worker-ом из PostgreSQL по `checkId`, а не дублируются в Redis.

## 2. Папки и ответственность

```text
src/check/
  check.service.ts                 # create + balance + enqueue; общая запись результата/refund
  providers/
    provider.types.ts              # общий контракт handler-а
    provider.registry.ts           # provider enum → handler
    stormfinder/
      stormfinder.handler.ts       # submit/poll через StormfinderService
      stormfinder.definitions.ts   # module → endpoint + buildRequest
      stormfinder.response.ts      # provider response → наши status/result/error

src/queue/check/
  check.processors.ts              # worker: вызывает CheckService.processSubmit/processSync
  check-queue.service.ts           # только BullMQ jobs
```

`StormfinderService` остаётся HTTP-клиентом: authorization, fetch, HTTP-ошибки. Он не знает ни о нашей БД, ни о модулях.

## 3. Контракт provider handler

```ts
interface ProviderCheckResult {
  serviceId: string;
  status: CheckStatusEnums;
  result?: Prisma.InputJsonValue;
  error?: Prisma.InputJsonValue;
}

interface CheckProviderHandler {
  readonly provider: CheckProviderEnums;

  submit(check: Check): Promise<ProviderCheckResult>;
  poll(check: Check): Promise<ProviderCheckResult>;
}
```

Registry выбирает handler **только** по сохранённому `check.provider`:

```ts
const handler = providerRegistry.get(check.provider);
```

Выбор `module → provider` уже происходит при создании проверки через `getCheckProvider(module)` и сохраняется в `Check.provider`. Поэтому worker не должен заново выбирать provider по модулю.

## 4. Stormfinder: карта и преобразование запросов

Карта находится внутри Stormfinder, потому что endpoint — его техническая деталь. Для текущих пяти модулей путь определяется только `module`:

```ts
const STORMFINDER_PATH_BY_MODULE = {
  GIBDD: '/checks/gibdd',
  GISTORGI: '/checks/gistorgi',
  FSSP: '/checks/fssp',
  BANKRUPTCY: '/checks/bancrupcy',
  INN: '/checks/inn',
} satisfies Record<CheckModuleEnums, string>;
```

Но body строится по `module` и `subjectBody.type` (если он есть). У frontend и Stormfinder форматы различаются:

| Наш `Check` | Stormfinder POST body |
| --- | --- |
| GIBDD: `{ vin, osago? }` | `{ subject: { vin }, client_reference: check.id, with_osago: osago ?? true }` |
| GISTORGI: `{ vin }` | `{ subject: { vin } }` |
| FSSP: `{ type: 'for_fio_dob', fio, dob }` | `{ mode: 'fio_dob', subject: { fio, dob } }` |
| FSSP: `for_inn / for_ip / for_doc_id` | `mode` без `for_`, остальные поля — в `subject` |
| BANKRUPTCY: `{ type: 'for_inn', inn }` | `{ subject: { inn } }` |
| BANKRUPTCY: `{ type: 'for_fio', fio }` | `{ subject: { fio } }` |
| INN: `{ type: 'for_structured', fio, dob, passport }` | `{ subject: { fio, dob, passport } }` |
| INN: `{ type: 'for_text', text }` | `{ subject: { text } }` |

`type` — наша внутренняя деталь для валидации и отображения — никогда не передаётся Stormfinder. Для FSSP из него получается `mode`.

`client_reference` для GIBDD рекомендую делать равным `check.id`: это позволит сопоставлять запрос с нашей проверкой и не зависит от формата пользовательского ввода. Idempotency-Key остаётся заголовком из `check.idempotencyKey`.

## 5. Методы в CheckService

### `createCheck`

1. Валидирует DTO до входа в сервис.
2. Строит и сохраняет `subjectBody` и `subjectBodyText`.
3. Находит provider через `getCheckProvider(module)`.
4. В одной БД-транзакции списывает баланс и создаёт `Check` со статусом `PENDING`.
5. **После commit** вызывает `checkQueueService.enqueueSubmit(check.id)`.
6. Возвращает frontend `202` с созданной проверкой.

Если enqueue не выполнился, не делать второй debit. Оставить запись `PENDING`: существующий startup recovery позже вызовет `ensureSubmit`. Для более строгой доставки следующим улучшением будет transactional outbox.

### `processSubmit(checkId)`

Метод вызывается только processor-ом:

1. Загружает `Check`.
2. Ничего не делает, если запись отсутствует, не `PENDING` или уже имеет `serviceId`.
3. Получает handler через `check.provider`.
4. Вызывает `handler.submit(check)`.
5. Сохраняет атомарно `serviceId`, `status`, `result/error`, `completedAt`.
6. Если `QUEUED`/`RUNNING`, ставит `sync-check`.
7. Если `DONE`, публикует websocket event.
8. Если provider вернул `FAILED`, сохраняет ошибку, возвращает стоимость ровно один раз и публикует event.

### `processSync(checkId)`

1. Загружает `Check`.
2. Завершается без действий, если нет `serviceId` или статус терминальный.
3. Получает handler через `check.provider` и вызывает `handler.poll(check)`.
4. Сохраняет новое состояние, только если оно изменилось (не делать лишний `updatedAt` и websocket event).
5. При `QUEUED`/`RUNNING` ставит следующий `sync-check` с delay 5 секунд.
6. При `DONE`/`FAILED` прекращает polling; для `FAILED` запускает идемпотентный refund.

## 6. Processor

Один processor, без `switch` по провайдерам:

```ts
@Processor(CHECK_SINGLE_QUEUE, { concurrency: 1 })
export class CheckProcessor extends WorkerHost {
  async process(job: Job<CheckJobData>) {
    if (job.name === CHECK_SUBMIT_JOB) {
      return this.checkService.processSubmit(job.data.checkId);
    }

    if (job.name === CHECK_SYNC_JOB) {
      return this.checkService.processSync(job.data.checkId);
    }
  }
}
```

Processor выбирает только этап работы. Провайдера выбирает `CheckService` по записи `Check`, а конкретный внешний формат формирует handler.

## 7. Jobs, повторения и ошибки

| Сценарий | Действие |
| --- | --- |
| POST Stormfinder не дошёл / 5xx / 429 | Дать BullMQ повторить `submit-check` с exponential backoff. Idempotency-Key не меняется. |
| Некорректное тело / 401 / 403 / постоянная 4xx | Перевести Check в `FAILED`, сохранить error, вернуть деньги один раз. |
| GET polling временно упал | Не возвращать деньги; поставить следующий `sync-check`. |
| Stormfinder вернул `failed` | Сохранить provider error, `FAILED`, один refund. |
| `queued` или `running` | Сохранить serviceId/status и поставить следующий sync. |
| `done` | Сохранить `result`, `DONE`, `completedAt`, websocket event. |

Для submit job использовать `jobId: checkId`. Для sync — `jobId: sync-${checkId}` и не создавать второй sync, пока такой job находится в `waiting/active/delayed`.

## 8. Порядок реализации

1. Создать Stormfinder handler и `definitions` с path + `buildRequest`; покрыть только GIBDD тестовым примером.
2. Добавить provider registry (`STORMFINDER → StormfinderHandler`) и метод получения handler-а по `Check.provider`.
3. В `createCheck` после commit вызвать `enqueueSubmit`; убрать временный `console.log(check)`.
4. Создать `CheckProcessor` с `processSubmit` и `processSync`.
5. Реализовать запись `serviceId/status/result` и polling для GIBDD; проверить вручную: `PENDING → QUEUED/RUNNING → DONE`.
6. Добавить FSSP mapping `type → mode`; затем GIS Torgi, bankruptcy, INN.
7. Добавить идемпотентный refund для terminal `FAILED`, retry policy и websocket updates.
8. Прогнать restart recovery: создать проверку, остановить процесс, поднять снова и убедиться, что submit/sync восстановились.

## 9. Критерий готовности первого шага

Для одной GIBDD-проверки:

1. HTTP отвечает `202`, а в БД сразу есть `PENDING`, `provider=STORMFINDER`, наш `subjectBody`.
2. Worker отправляет **именно** `{ subject: { vin }, with_osago, client_reference }`.
3. Ответ `202` Stormfinder записывает `serviceId` и `QUEUED`/`RUNNING`.
4. Worker poll-ит `/checks/{serviceId}` каждые 5 секунд.
5. `done` записывает `result` и `completedAt`; `failed` — `error`, `completedAt`, один refund.
