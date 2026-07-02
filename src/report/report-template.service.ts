import { Injectable } from '@nestjs/common';
import { Check, CheckModuleEnums } from '@/db';
import { renderDefaultTemplate } from './templates/default.template';
import { renderFsspTemplate } from './templates/fssp.template';
import { renderInnTemplate } from './templates/inn.template';
import { renderGibddTemplate } from './templates/gibdd.template';

@Injectable()
export class ReportTemplateService {
  public renderCheckReport(check: Check): string {
    switch (check.module) {
      case CheckModuleEnums.FSSP:
        return renderFsspTemplate(check);
      case CheckModuleEnums.INN:
        return renderInnTemplate(check);
      case CheckModuleEnums.GIBDD:
        return renderGibddTemplate(check);
      default:
        return renderDefaultTemplate(check);
    }
  }
}
