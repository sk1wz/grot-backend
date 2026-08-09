# План перестройки области проверок

## Цель

Сделать единый, типизированный жизненный цикл проверки:

```text
Frontend → HTTP-контракт → создание Check + списание → очередь
         → выбор provider adapter → запрос провайдеру → polling
         → нормализация ответа → результат для frontend
```

Контракт входных данных из `data.md` является контрактом frontend и backend. `subjectBody` хранит исходные структурированные данные, а `subjectBodyText` — готовую подпись для списка проверок на frontend. Формат запроса провайдера и его ответ не должны проникать в HTTP-контракт и остальную бизнес-логику.

## Что есть сейчас

- В Prisma уже начата миграция `Check.subject` → `subjectBody` и добавлено `subjectBodyText`, но TypeScript-код всё ещё обращается к `subject`. В таком состоянии проект не соберётся после генерации Prisma-клиента.
- DTO и endpoints используют старый контракт `{ subject, mode }`, а `data.md` — целевой `{ subjectBody, type? }`.
- `CheckService` напрямую зависит от `StormfinderService` и таблицы путей. При добавлении второго провайдера придётся менять центральный сервис.
- BullMQ-очередь фактически единая: `checks-single`, jobs `submit-check` и `sync-check`. `QUEUE.md` описывает уже удалённые очереди по модулям, поэтому его нужно переписать либо удалить и перенести актуальную документацию сюда.
- В рабочем дереве уже есть пользовательское изменение Prisma и новый `data.md`; их не заменять несогласованно.

## Целевая модель данных

### `Check` — одна фактическая проверка

Оставить одну запись `Check` на каждую фактическую проверку. Модель должна остаться компактной: использовать текущую структуру из Prisma и добавить только `provider` как enum.

| Поле | Назначение |
| --- | --- |
| `module` | Бизнес-модуль: `GIBDD`, `FSSP`, `INN` и т. п. |
| `provider` (`CheckProviderEnums`) | Провайдер исполнения, например `STORMFINDER`; фиксируется до постановки в очередь. |
| `subjectBody` (`Json`) | Полные нормализованные входные данные: `{ type?: 'for_inn', ...subjectBody }`. Отдельная колонка `type` не нужна. |
| `subjectBodyText` (`String`) | Детерминированная человекочитаемая строка, например `VIN XTA…`, `ИНН 123…`, `Иванов И.И., 01.01.1990`. |
| `result` (`Json?`) | Нормализованный результат в нашей схеме, который отдаётся frontend. |
| `idempotencyKey` | Ключ именно внешней операции. Генерируется до постановки в очередь и не меняется при retry. |

`serviceId` остаётся идентификатором операции у выбранного провайдера. `cost`, `balanceRefund`, статусы и временные поля сохранить. Возврат должен быть защищён уникальностью: одна проверка не может вернуть деньги дважды, даже если несколько workers увидят ошибку одновременно.

Минимальное изменение Prisma:

```prisma
model Check {
  // существующие поля
  provider CheckProviderEnums
}

enum CheckProviderEnums {
  STORMFINDER
}
```

### `CheckBatch` — группа для интерфейса и оплаты

Не реализовывать в первом этапе, но заложить миграцией/контрактом отдельную сущность, а не хранить batch JSON в `Check`:

| Поле | Назначение |
| --- | --- |
| `id`, `userId`, `module` | Владелец и тип загруженной проверки. |
| `status` | `PENDING`, `RUNNING`, `DONE`, `PARTIAL_FAILED`, `FAILED`. |
| `totalCount`, `startedCount`, `completedCount`, `failedCount` | Прогресс для frontend. |
| `totalCost`, `refundedCost` | Итоги единой оплаты и возвратов. |
| `idempotencyKey` | Защита повторной загрузки файла/повторного POST. |
| `sourceFile`/`sourceMeta` | Ссылка на исходный файл и номер/метаданные строки, без хранения Excel целиком в JSON. |

Связь: `CheckBatch 1 — N Check`. Frontend показывает `CheckBatch` как одну сущность, но каждая строка остаётся обычной `Check`, поэтому использует тот же provider pipeline и тот же экран деталей.

## Единый контракт и типизация

1. Сделать отдельный пакет/каталог `contracts/checks` — единственный источник истины для frontend и backend. Предпочтительно Zod-схемы: они дают runtime-валидацию на сервере и TypeScript-типы для обоих приложений. Если общий пакет пока невозможен, опубликовать его как внутренний npm-пакет с версией.
2. Описать discriminated union по `module` и `type` из `data.md`:

```ts
type CreateCheckRequest =
  | { module: 'GIBDD'; subjectBody: { vin: string; osago?: true } }
  | { module: 'GISTORGI'; subjectBody: { vin: string } }
  | { module: 'FSSP'; type: 'for_fio_dob'; subjectBody: { fio: string; dob: string } }
  | { module: 'FSSP'; type: 'for_inn'; subjectBody: { inn: string } }
  // остальные варианты из data.md
```

Маршрут может остаться `POST /checks/gibdd`, поэтому `module` берётся из маршрута; в сервис он поступает как `{ module, type, subjectBody }`, а перед сохранением собирается `Check.subjectBody = { type, ...subjectBody }` (без ключа `type`, если режима нет). Не допускать одновременно старые `subject/mode` и новые `subjectBody/type` без явно ограниченного переходного периода.

3. В `data.md` исправить и закрепить реальные имена: `bankruptcy` (с временным alias `bancrupcy`, если frontend уже выпущен), режимы с префиксом `for_…`, обязательность `type`, форматы дат и полей. Добавить примеры успешного `202` и ошибок `400/402`.
4. Убрать дублирующие provider-specific DTO/services (`GibddService`, `FsspService` и т. п.) или оставить их только тонкими контроллерами. Валидация и создание команды живут в contracts/factory, не в пяти разных копиях DTO.

## Реестр модулей и адаптеры провайдеров

### Реестр проверок

Создать `src/checks/definitions/` с одним definition на комбинацию `module + type`. Definition отвечает за наши данные, а не за HTTP провайдера:

```ts
interface CheckDefinition<TSubject, TResult> {
  key: { module: CheckModule; type: string | null };
  inputSchema: ZodType<TSubject>;
  subjectBodyText(subject: TSubject): string;
  selectProvider(subject: TSubject): CheckProvider;
  resultSchema: ZodType<TResult>;
}
```

Здесь формируется `subjectBodyText`, нормализуются пробелы/регистр/VIN, но не изменяется смысл введённых данных. Именно definition определяет, какой провайдер обслуживает модуль.

### Адаптер провайдера

Создать `src/checks/providers/` и интерфейс:

```ts
interface CheckProviderAdapter {
  provider: CheckProvider;
  submit(check: StoredCheck): Promise<ProviderSubmission>;
  poll(check: StoredCheck): Promise<ProviderStatusResponse>;
  toResult(check: StoredCheck, response: unknown): NormalizedProviderResult;
}
```

`StormfinderAdapter` содержит внутреннюю карту `module/type → path + buildRequest + parseResponse`. Например, FSSP преобразует наш `type: for_inn` в нужную Stormfinder форму, а не передаёт DTO напрямую. Для нового провайдера добавляется новый adapter и definition/маршрутизация; `CheckService`, очередь и контроллеры не переписываются.

Не хранить endpoint и provider payload в контроллерах. Все ответы провайдера сначала валидируются его schema, затем маппятся в наш `result` и валидируются result schema. Неизвестная/сломанная схема ответа — контролируемая ошибка проверки с сохранением безопасного diagnostic payload, а не произвольный JSON для frontend.

## Поток одиночной проверки

```text
POST /checks/:module
  → validate contract
  → definition: normalize + subjectBodyText + provider
  → DB transaction:
       lock/update user balance, create BALANCE_PURCHASE,
       create Check(PENDING, provider, subjectBody, subjectBodyText)
  → enqueue submit(checkId) после commit
  → 202 Check response

submit worker
  → atomically reserve Check for submission
  → adapter.submit()
  → persist serviceId + mapped status/result
  → enqueue poll only for active status

poll worker
  → adapter.poll(serviceId)
  → validate + normalize response
  → transactionally persist status/result or fail + refund
  → re-enqueue only while active
  → websocket event after transaction for state/progress
```

Важно:

- `enqueue` не входит в транзакцию БД. Для гарантии доставки добавить transactional outbox (`CheckOutboxEvent`) в той же транзакции и небольшой publisher, либо оставить startup recovery как дополнительную страховку. Только recovery не закрывает короткое окно между commit и enqueue.
- Перед внешним POST worker должен атомарно перейти из `PENDING` в состояние отправки/захватить lease. Это предотвращает два POST при повторной задаче.
- Повторять нужно только временные сетевые ошибки/5xx/429. Ошибки валидации запроса, 401/403 и корректный отказ провайдера завершают проверку и запускают ровно один refund.
- `CheckResponseDto` отдаёт `subjectBody` и `subjectBodyText`, но не idempotency key и другие внутренние ключи.

## Batch: проектировать сейчас, реализовать вторым этапом

### Приём Excel

1. `POST /check-batches/:module` принимает файл и `Idempotency-Key`.
2. Parser конкретного Excel-шаблона переводит каждую строку в тот же `CreateCheckCommand`; в ответе строки обязаны иметь `rowNumber` и понятные ошибки. Файл с хотя бы одной невалидной строкой не создаёт платный batch.
3. В одной транзакции создать `CheckBatch`, все дочерние `Check` и **одно** `BALANCE_PURCHASE` на сумму дочерних проверок. В meta операции хранить `batchId`, количество и сумму.

### Строгая очередь по 10

Не ставить сразу все дочерние проверки в обычную очередь. Нужен `batch-orchestrator` job:

```text
batch-start → enqueue первых min(10, total) Check
  → ждать терминального состояния всех checks текущей пачки
  → aggregate batch counters
  → enqueue следующие 10
  → финализировать CheckBatch
```

После terminal event дочерней проверки транзакционно увеличивать счётчики batch и ставить/будить orchestrator с уникальным `jobId=batchId`. Один batch обрабатывает только один активный chunk; разные batch могут выполняться параллельно в рамках лимитов провайдера. Размер chunk (`10`), максимальная параллельность и пауза/retry задаются config-ом.

При ошибке одной дочерней проверки возвращать её `cost` (то есть «вернуть баланс за 1»), а `CheckBatch.refundedCost` увеличивать на ту же сумму. Не делать полный возврат за batch, если это не отдельное бизнес-правило. Финальный статус `PARTIAL_FAILED` показывает, что часть строк не прошла.

## Порядок внедрения

1. **Зафиксировать контракт.** Согласовать `data.md`, названия `type`, endpoint bankruptcy и форму ответов. Создать shared contracts и контрактные тестовые fixtures.
2. **Миграция одиночных проверок.** Довести Prisma: `subjectBody`, `subjectBodyText` и enum `provider`; написать безопасную миграцию старых `subject` в `subjectBody`, backfill текста и временную совместимость только при необходимости.
3. **Переписать application layer.** Ввести `CreateCheckCommand`, definitions, единый `CheckService.create`; перевести все endpoint на `{ type?, subjectBody }`; убрать старые `subject/mode` обращения и обновить responses.
4. **Вынести Stormfinder.** Реализовать adapter, request/response мапперы по module/type, тесты на каждый вариант `data.md`. Центральный сервис перестаёт импортировать Stormfinder напрямую.
5. **Усилить очередь и оплату.** Outbox, lease/idempotency, классификация ошибок, идемпотентный refund, обновлённая recovery-логика. Переписать `QUEUE.md` по актуальной единой очереди.
6. **Наблюдаемость и тесты.** Логи с `checkId`, provider и `serviceId`; метрики очереди/retry/ошибок/возвратов; unit tests definitions/adapters, интеграционные tests transaction+outbox, e2e single flow.
7. **Batch.** Миграция `CheckBatch`, Excel parser и preview, атомарная оплата, batch-orchestrator по 10, UI/websocket progress, e2e сценарии частичного провала и рестарта worker.

## Критерии готовности первого этапа

- Каждый пример из `data.md` валиден на backend и имеет общий TypeScript-тип с frontend.
- В БД есть исходный `subjectBody` (включая `type`, если он предусмотрен модулем), корректный `subjectBodyText` и выбранный provider.
- Добавление нового provider требует adapter + мапперов/definition, но не изменений контроллеров, `CheckService` и processor.
- Перезапуск приложения, повтор job и повтор HTTP-запроса не создают двойной внешний запрос, двойное списание или двойной возврат.
- Frontend получает один стабильный формат `CheckResponse`, независимо от Stormfinder и будущих провайдеров.
- Batch не реализован в single pipeline преждевременно, но его модель, оплата и последовательность chunks не потребуют переделки `Check`.
