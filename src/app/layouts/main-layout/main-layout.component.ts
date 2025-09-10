import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="main-layout">
      <header class="header">
        <div class="header-container">
          <h1>Junto a TIC</h1>
        </div>
      </header>
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .main-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: linear-gradient(135deg, #4A90A4 0%, #2C5F6F 100%);
      color: white;
      padding: 1rem 0;
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .main-content {
      flex: 1;
    }
  `]
})
export class MainLayoutComponent {}