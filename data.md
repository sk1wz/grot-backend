# Контракт API checker

Документ описывает фактические запросы, которые frontend отправляет при запуске проверок.

## Общие правила

- Метод всех endpoint’ов: `POST`.
- Заголовок: `Content-Type: application/json`.
- Запрос выполняется с cookie (`credentials: "include"`).
- Для проверок без режимов тело содержит только `subjectBody`.
- Для проверок с режимами тело содержит `type` и `subjectBody`.
- `subjectBody` — объект исходных данных проверки. Его поля не сериализуются в строку.

```ts
type PlainCheckRequest<TSubjectBody extends Record<string, unknown>> = {
  subjectBody: TSubjectBody;
};

type CheckRequestWithType<
  TType extends string,
  TSubjectBody extends Record<string, unknown>,
> = {
  type: TType;
  subjectBody: TSubjectBody;
};
```

## ГИБДД

`POST /checks/gibdd`

```ts
type GibddRequest = {
  subjectBody: {
    vin: string; // ровно 17 символов
    osago?: true; // поле отсутствует, если ОСАГО не запрошено
  };
};
```

Пример:

```json
{
  "subjectBody": {
    "vin": "XTA210740Y2765432",
    "osago": true
  }
}
```

## ГИС Торги

`POST /checks/gistorgi`

```ts
type GisTorgiRequest = {
  subjectBody: {
    vin: string; // ровно 17 символов
  };
};
```

## ФССП

`POST /checks/fssp`

```ts
type FsspRequest =
  | {
      type: "for_fio_dob";
      subjectBody: { fio: string; dob: string }; // dob: ДД.ММ.ГГГГ
    }
  | {
      type: "for_inn";
      subjectBody: { inn: string }; // 10 или 12 цифр
    }
  | {
      type: "for_ip";
      subjectBody: { ip: string };
    }
  | {
      type: "for_doc_id";
      subjectBody: { doc_id: string };
    };
```

## Банкротства

`POST /checks/bancrupcy`

> В URL используется `bancrupcy` — именно так он задан во frontend. Если endpoint должен называться `bankruptcy`, потребуется синхронно изменить frontend.

```ts
type BankruptcyRequest =
  | {
      type: "for_inn";
      subjectBody: { inn: string }; // 10 или 12 цифр
    }
  | {
      type: "for_fio";
      subjectBody: { fio: string };
    };
```

## ИНН по паспорту

`POST /checks/inn`

```ts
type InnRequest =
  | {
      type: "for_structured";
      subjectBody: {
        fio: string;
        dob: string; // ДД.ММ.ГГГГ
        passport: string;
      };
    }
  | {
      type: "for_text";
      subjectBody: { text: string };
    };
```

## Краткая таблица endpoint’ов

| Проверка | Endpoint | `type` |
| --- | --- | --- |
| ГИБДД | `/checks/gibdd` | отсутствует |
| ГИС Торги | `/checks/gistorgi` | отсутствует |
| ФССП | `/checks/fssp` | `for_fio_dob`, `for_inn`, `for_ip`, `for_doc_id` |
| Банкротства | `/checks/bancrupcy` | `for_inn`, `for_fio` |
| ИНН по паспорту | `/checks/inn` | `for_structured`, `for_text` |
