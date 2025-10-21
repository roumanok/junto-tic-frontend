import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AppLoadingService {
  private platformId = inject(PLATFORM_ID);
  private _isLoading = signal<boolean>(true);
  
  readonly isLoading = this._isLoading.asReadonly();

  startLoading(): void {
    this._isLoading.set(true);
  }

  finishLoading(): void {
    // Ocultar el splash del index.html con fade out
    if (isPlatformBrowser(this.platformId)) {
      const splash = document.getElementById('initial-splash');
      if (splash) {
        splash.classList.add('hidden');
        
        // Removerlo del DOM después del fade
        setTimeout(() => {
          splash.remove();
        }, 500);
      }
    }

    this._isLoading.set(false);
  }
}