import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.overlay]="overlay">
      <div class="spinner">
        <div class="spinner-circle"></div>
      </div>
      <p *ngIf="message" class="loading-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-container.overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      z-index: 9999;
    }

    .spinner {
      width: 40px;
      height: 40px;
      margin-bottom: 1rem;
    }

    .spinner-circle {
      width: 100%;
      height: 100%;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4A90A4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-message {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
      text-align: center;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message: string = '';
  @Input() overlay: boolean = false;
}