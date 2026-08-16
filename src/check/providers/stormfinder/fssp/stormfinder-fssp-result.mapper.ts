import { FsspResultSchema } from '@/check/fssp/schema';

export function mapStormfinderFsspResult(result: Record<string, unknown>) {
  const source = isRecord(result.summary) ? result.summary : {};
  const parsed = FsspResultSchema.safeParse({
    summary: {
      id: source.id,
      date: source['Дата'],
      service: source['Сервис'],
      initiationDate: source['Дата возбуждения'],
      bailiffContacts: source['Контакты пристава'],
      enforcementSubject: source['Предмет исполнения'],
      enforcementFee: source['Исполнительный сбор'],
      bailiffDepartment: source['Отдел судебных приставов'],
      consolidatedProceedingNumber: source['Номер Сводного производства'],
      bailiff: source['Судебный пристав-исполнитель'],
      debtAmount: source['Сумма задолженности по ИП (Руб)'],
      enforcementProceedingNumber: source['Исполнительное производство №'],
      bailiffDepartmentAddress: source['Адрес отдела судебных приставов'],
      terminationReason: source['Причина окончания или прекращения ИП'],
      debtor:
        source[
          'Должник (физ. лицо: ФИО, дата и место рождения; юр. лицо: наименование, юр. адрес, фактический адрес, ИНН)'
        ],
      executiveDocumentDetails:
        source[
          'Реквизиты исполнительного документа (вид, дата принятия...выдавшего исполнительный документ, ИНН взыскателя-организации)'
        ],
    },
  });
  return parsed.success ? parsed.data : result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
