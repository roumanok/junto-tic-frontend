import { Injectable, inject, signal, computed } from '@angular/core';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private theme = inject(ThemeService);
  
  private _currentLang = signal('es'); // idioma por defecto
  
  readonly currentLang = this._currentLang.asReadonly();
  
  readonly translations = computed(() => this.theme.i18n());
  
  /**
   * Obtiene una traducción por su clave
   */
  t(key: string, params?: Record<string, any>): string {
    const translations = this.translations();
    let translation = translations[key] || '...';
    
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return translation;
  }
    
  setLanguage(lang: string): void {
    this._currentLang.set(lang); 
    console.log('Language set to:', lang);   
  }
  
  /**
   * Verifica si existe una traducción para la clave dada
   */
  has(key: string): boolean {
    return key in this.translations();
  }
}