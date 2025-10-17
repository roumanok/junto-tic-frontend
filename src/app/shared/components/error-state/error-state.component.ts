import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-state.component.html',
  styleUrls: ['./error-state.component.css']
})
export class ErrorStateComponent {
  @Input() title: string = 'Error';
  @Input() message: string = 'Ha ocurrido un error';
  @Input() icon: string = 'fa-exclamation-triangle';
  @Input() retryButtonText: string = 'Reintentar';
  @Input() showRetryButton: boolean = true;
  @Input() minHeight: string = '400px';
  
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}