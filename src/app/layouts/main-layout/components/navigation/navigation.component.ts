import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { MegaMenuComponent } from './mega-menu/mega-menu.component';
import { CategoryService } from 'src/app/core/services/category.service';
import { Category } from 'src/app/core/models/category.model';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MegaMenuComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  megaMenuData$: Observable<Category[]>;
  //isMobileMenuOpen$: Observable<boolean>;

  constructor(
    private cats: CategoryService
  ) {
    this.megaMenuData$ = this.cats.all$;    
    //this.isMobileMenuOpen$ = this.store.select(selectIsMobileMenuOpen);    
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu(): void {
   // this.store.dispatch(AppActions.toggleMobileMenu());
  }
}