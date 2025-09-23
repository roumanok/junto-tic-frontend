// src/app/shared/pipes/translate.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from 'src/app/core/services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false 
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);
  
  transform(key: string, params?: Record<string, any>): string {
    return this.i18n.t(key, params);
  }
}