# API: проверки, batch и отчеты

Актуально для текущего backend. Во всех примерах `BASE_URL` означает адрес API,
например `http://localhost:3000`. Глобальный префикс `/api` в приложении не
включен.

## Авторизация и роли

API использует сессионную cookie, а не Bearer token. Сначала нужно выполнить
`POST /auth/login`; браузер получит cookie сессии автоматически. В `curl`
сохраните cookie и передавайте ее далее:

```bash
curl -c cookies.txt -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

curl -b cookies.txt "$BASE_URL/checks"
```

Все описанные маршруты требуют авторизации. Маршруты с пометкой `ADMIN`
дополнительно требуют роль `ADMIN`.

| Код | Значение |
|---|---|
| `401` | Нет действующей сессии. |
| `403` | Сессия есть, но у пользователя нет роли `ADMIN`. |
| `404` | Объект не найден, не принадлежит пользователю или отчет еще не готов. |
| `400` | Некорректное тело запроса или Excel-файл. |

## Модули

Во всех путях ниже заменяйте `{module}` на один из значений:

| Модуль | Путь |
|---|---|
| ГИБДД | `gibdd` |
| ФССП | `fssp` |
| ГИС Торги | `gistorgi` |
| ИНН | `inn` |
| Банкротство | `bankruptcy` |
| Ограничения | `limitation` |
| Такси | `taxi` |

Для банкротства также сохранен альтернативный путь `checks/bancrupcy`.

## Одиночные проверки: пользователь

### Получить все одиночные проверки

```http
GET /checks
```

Возвращает все одиночные проверки текущего пользователя по всем модулям,
отсортированные от новых к старым. Дочерние проверки из batch сюда не входят.

### Получить все одиночные проверки одного модуля

```http
GET /checks/{module}
```

Возвращает одиночные проверки текущего пользователя только для выбранного
модуля. Дочерние проверки batch также не входят в ответ.

Пример:

```bash
curl -b cookies.txt "$BASE_URL/checks/gibdd"
```

### Получить одну проверку

```http
GET /checks/{checkId}
```

Возвращает проверку по UUID, если она принадлежит текущему пользователю.
Этот маршрут может вернуть и дочернюю проверку batch, если известен ее ID.

### Создать одиночную проверку

```http
POST /checks/{module}
Content-Type: application/json
```

Запрос ставится в очередь и возвращается с `202 Accepted`. Общая форма ответа:

```json
{
  "id": "uuid",
  "module": "GIBDD",
  "status": "PENDING",
  "subjectBody": { "vin": "XTA210740Y2760000" },
  "subjectBodyText": "...",
  "cost": 100,
  "result": null,
  "error": null,
  "createdAt": "2026-08-22T10:00:00.000Z",
  "updatedAt": "2026-08-22T10:00:00.000Z",
  "completedAt": null
}
```

### Тела запросов для одиночных проверок

ГИБДД, ГИС Торги, Ограничения и Такси используют VIN из 17 символов. Буквы
`I`, `O` и `Q` не допускаются. Для ГИБДД необязателен флаг `osago`, но только
со значением `true`.

```json
{ "subjectBody": { "vin": "XTA210740Y2760000" } }
```

```json
{ "subjectBody": { "vin": "XTA210740Y2760000", "osago": true } }
```

ФССП:

```json
{ "type": "for_fio_dob", "subjectBody": { "fio": "Иванов Иван Иванович", "dob": "01.01.1990" } }
```

```json
{ "type": "for_inn", "subjectBody": { "inn": "7707083893" } }
```

```json
{ "type": "for_ip", "subjectBody": { "ip": "12345/24/77000-ИП" } }
```

```json
{ "type": "for_doc_id", "subjectBody": { "doc_id": "12-34/56" } }
```

Для типа `for_inn` ИНН должен содержать 10 или 12 цифр.

ИНН:

```json
{ "type": "for_structured", "subjectBody": { "fio": "Иванов Иван Иванович", "dob": "01.01.1990", "passport": "4500 123456" } }
```

```json
{ "type": "for_text", "subjectBody": { "text": "свободный поисковый запрос" } }
```

Банкротство:

```json
{ "type": "for_inn", "subjectBody": { "inn": "7707083893" } }
```

```json
{ "type": "for_fio", "subjectBody": { "fio": "Иванов Иван Иванович" } }
```

## Batch: пользователь

### Получить все batch выбранного модуля

```http
GET /checks/{module}/batch
```

Возвращает batch текущего пользователя только для указанного модуля, от новых
к старым. Универсального маршрута `GET /batch` для всех модулей в текущем API
нет: клиент должен вызвать этот маршрут отдельно для каждого нужного модуля.

Пример:

```bash
curl -b cookies.txt "$BASE_URL/checks/fssp/batch"
```

Пример элемента ответа:

```json
{
  "id": "uuid",
  "module": "FSSP",
  "status": "RUNNING",
  "totalItems": 100,
  "successfulItems": 57,
  "failedItems": 2,
  "cost": 10000,
  "subjectBodyText": "source.xlsx",
  "currentChunk": 59,
  "createdAt": "2026-08-22T10:00:00.000Z",
  "completedAt": null
}
```

Статусы: `PENDING`, `QUEUED`, `RUNNING`, `DONE`, `FAILED`.

### Создать batch

```http
POST /checks/{module}/batch
Content-Type: multipart/form-data
```

Передайте XLSX-файл в поле `file`. Успешный ответ имеет статус `202 Accepted`
и содержит созданный batch со статусом `QUEUED`.

```bash
curl -b cookies.txt -X POST "$BASE_URL/checks/gibdd/batch" \
  -F "file=@C:\\files\\gibdd.xlsx"
```

Файл читается только из первого листа. Заголовки находятся в первой строке и
сравниваются без учета регистра. Пустые строки пропускаются.

| Модули | Необходимые столбцы XLSX |
|---|---|
| `gibdd`, `gistorgi`, `limitation`, `taxi` | `VIN` |
| `inn` | `ФИО`, `ДАТА РОЖДЕНИЯ`, `ПАСПОРТ` |
| `bankruptcy` | хотя бы `ИНН` или `ФИО`; в одной строке могут быть оба значения, тогда будут созданы две проверки |
| `fssp` | хотя бы `ИНН`, `НОМЕР ИП`, `НОМЕР ИЛ` или `ФИО`; для `ФИО` обязателен еще столбец `ДАТА РОЖДЕНИЯ` |

Для `VIN` действует та же проверка из 17 символов. Дата рождения должна быть
распознана как дата Excel или передана в формате `ДД.ММ.ГГГГ`. Для ФССП ИНН
должен состоять из 10 или 12 цифр.

### Получить один batch

Отдельного маршрута `GET /checks/.../batch/{batchId}` в текущем HTTP API нет.
Доступны список batch по модулю и скачивание готового отчета по `batchId`.
Детали дочерних проверок получить через публичный HTTP API также нельзя без
заранее известных ID этих проверок.

## Обновления batch по Socket.IO

Подключение создается к namespace `/batch`. Клиент передает `userId` в query и
подписывается на событие `batch.updated`.

```ts
import { io } from 'socket.io-client';

const socket = io(`${BASE_URL}/batch`, {
  query: { userId },
  withCredentials: true,
});

socket.on('batch.updated', (batch) => {
  console.log(batch);
});
```

Событие отправляется после создания batch (статус `QUEUED`), при обновлении
прогресса (`RUNNING`) и при завершении (`DONE` или `FAILED`). Payload совпадает
с элементом списка batch.

## Скачивание Excel: обычный пользователь

### Отчет по одиночной проверке

```http
GET /checks/report/excel/{checkId}
```

Скачать может только владелец проверки. Отчет доступен, когда проверка получила
статус `DONE`. Ответ -- XLSX с именем
`autosintes-report-{checkId}.xlsx`.

```bash
curl -b cookies.txt -L \
  -o single-report.xlsx \
  "$BASE_URL/checks/report/excel/{checkId}"
```

### Отчет по batch

```http
GET /checks/report/batch/{batchId}
```

Скачать может только владелец batch. Отчет доступен после заполнения
`completedAt`, то есть после окончания batch. Ответ -- XLSX с именем
`autosintes-batch-report-{batchId}.xlsx`.

```bash
curl -b cookies.txt -L \
  -o batch-report.xlsx \
  "$BASE_URL/checks/report/batch/{batchId}"
```

Если файла отчета еще нет на диске, сервер сформирует его при первом успешном
запросе на скачивание.

## Проверки и отчеты: администратор

Все маршруты этого раздела требуют роль `ADMIN`. Cookie администратора
передается тем же способом, что и для обычного пользователя.

### Получить одну проверку без проверки владельца

```http
GET /checks/admin/check/{checkId}
```

Возвращает проверку по ID любого пользователя, включая дочернюю проверку batch.

### Получить все одиночные проверки конкретного пользователя

```http
GET /checks/admin/{userId}
```

Возвращает все одиночные проверки пользователя `userId` по всем модулям.
Как и пользовательский список, дочерние проверки batch сюда не входят.

### Получить все batch конкретного пользователя

```http
GET /checks/admin/{userId}/batch
```

Возвращает batch указанного пользователя по всем модулям, от новых к старым.
В каждом элементе есть ID, модуль, статус, прогресс, стоимость и даты.

### Скачать отчет по одиночной проверке

```http
GET /checks/report/admin/excel/{checkId}
```

Администратор может скачать готовый отчет любой одиночной проверки. Проверка
должна иметь статус `DONE`.

```bash
curl -b admin-cookies.txt -L \
  -o single-report.xlsx \
  "$BASE_URL/checks/report/admin/excel/{checkId}"
```

### Скачать отчет по batch

```http
GET /checks/report/admin/batch/{batchId}
```

Администратор может скачать отчет любого завершенного batch. При отсутствии
файла сервер формирует его перед отправкой.

```bash
curl -b admin-cookies.txt -L \
  -o batch-report.xlsx \
  "$BASE_URL/checks/report/admin/batch/{batchId}"
```

В текущем API нет административного списка всех batch системы. Для выборки
batch конкретного пользователя используйте `GET /checks/admin/{userId}/batch`.

## Практический порядок работы

1. Авторизоваться и сохранить cookie сессии.
2. Для одиночной проверки вызвать `POST /checks/{module}` и сохранить `id`.
3. Для batch загрузить XLSX через `POST /checks/{module}/batch` и сохранить
   `id` batch.
4. Обновлять интерфейс по `batch.updated` или повторно запрашивать
   `GET /checks/{module}/batch`.
5. После `DONE` скачать соответствующий XLSX-отчет.

## Обратная связь

### Отправить заявку с формы

```http
POST /feedback
Content-Type: multipart/form-data
```

Маршрут публичный: сессия не требуется. Все текстовые поля обязательны; файл
в поле `file` необязателен. Вложение сохраняется в базе данных вместе с
именем, MIME-типом и размером. Максимальный размер файла -- 10 МБ.

```bash
curl -X POST "$BASE_URL/feedback" \
  -F "name=Иван Иванов" \
  -F "companyName=ООО Ромашка" \
  -F "email=ivan@example.com" \
  -F "phone=+79991234567" \
  -F "message=Прошу связаться со мной" \
  -F "file=@C:\\files\\request.pdf"
```

После создания заявка получает статус `NEW`.

### Заявки: администратор

Все маршруты ниже требуют роль `ADMIN`.

| Действие | Метод и путь |
|---|---|
| Список всех заявок | `GET /feedback/admin` |
| Одна заявка | `GET /feedback/admin/{id}` |
| Изменить статус | `PATCH /feedback/admin/{id}/status` |
| Скачать вложение | `GET /feedback/admin/{id}/attachment` |
| Удалить заявку | `DELETE /feedback/admin/{id}` |

Для смены статуса отправьте JSON:

```json
{ "status": "IN_REVIEW" }
```

Допустимые статусы: `NEW` (новое), `IN_REVIEW` (на рассмотрении), `REJECTED`
(отказ), `COMPLETED` (завершено), `ARCHIVED` (архив).
