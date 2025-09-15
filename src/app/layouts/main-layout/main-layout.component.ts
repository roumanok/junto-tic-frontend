import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AppState } from '../../store/app.state';
import { selectGlobalLoading, selectGlobalError } from '../../store/app.selectors';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, NavigationComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading$: Observable<boolean>;
  globalError$: Observable<string | null>;
  //appInitialized$: Observable<boolean>;

   constructor(
    private store: Store<AppState>,
    //private seoService: SeoService
  ) {
    this.isLoading$ = this.store.select(selectGlobalLoading);
    this.globalError$ = this.store.select(selectGlobalError);
    //this.appInitialized$ = this.store.select(selectAppInitialized);
  }

  ngOnInit(): void {
    // Configurar SEO base
    /*
    this.seoService.updateForCommunity(
      'Tienda Online',
      'Encuentra los mejores productos y servicios'
    );
    */

    // Suscribirse a cambios del estado de la app
    /*
    this.appInitialized$
      .pipe(takeUntil(this.destroy$))
      .subscribe(initialized => {
        if (initialized) {
          console.log('App initialized successfully');
        }
      });
      */
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}