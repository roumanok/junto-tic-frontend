import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from './store/app.state';
import * as AppActions from './store/app.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'junto-tic-frontend';

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    this.store.dispatch(AppActions.loadCommunity());
    this.store.dispatch(AppActions.loadTheme());
    this.store.dispatch(AppActions.loadCategories());
  }
}