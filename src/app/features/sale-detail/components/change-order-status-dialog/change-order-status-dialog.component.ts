import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

export interface ChangeOrderStatusData {
  currentStatus: string;
  orderId: string;
  publicId: string;
}

type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-change-order-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule
  ],
  template: `
    <h2 mat-dialog-title>Cambiar estado de la orden</h2>
    <mat-dialog-content>
      <div class="status-selection">
        <h3>Seleccionar nuevo estado:</h3>
        <mat-radio-group [(ngModel)]="selectedStatus" class="status-radio-group">
          <mat-radio-button 
            *ngFor="let status of availableStatuses" 
            [value]="status.value"
            class="status-option"
            [class.status-pending]="status.value === 'pending'"
            [class.status-processing]="status.value === 'processing'"
            [class.status-delivered]="status.value === 'delivered'"
            [class.status-cancelled]="status.value === 'cancelled'"
          >
            <div class="status-option-content">
              <i class="fas" [ngClass]="status.icon"></i>
              <span class="status-label">{{ status.label }}</span>
              <span *ngIf="status.description" class="status-description">
                {{ status.description }}
              </span>
            </div>
          </mat-radio-button>
        </mat-radio-group>
      </div>

      <div *ngIf="!hasAvailableStatuses()" class="no-changes">
        <i class="fas fa-info-circle"></i>
        <p>No hay cambios de estado disponibles. La orden ya fue entregada.</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary"
        (click)="onConfirm()"
        [disabled]="!selectedStatus || selectedStatus === data.currentStatus"
      >
        Cambiar Estado
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px;
      min-width: 450px;
      max-width: 600px;
    }

    .order-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .order-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #2c3e50;
    }

    .status-selection h3 {
      font-size: 16px;
      color: #2c3e50;
      margin-bottom: 15px;
      font-weight: 600;
    }

    .status-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-option {
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .status-option:not(.mat-radio-disabled):hover {
      background: #f8f9fa;
      border-color: #4A90A4;
    }

    .status-option.mat-radio-checked {
      background: #e8f4f8;
      border-color: #4A90A4;
    }

    .status-option-content {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 8px;
    }

    .status-option-content i {
      font-size: 20px;
      width: 24px;
    }

    .status-pending i {
      color: #ffc107;
    }

    .status-processing i {
      color: #4A90A4;
    }

    .status-delivered i {
      color: #28a745;
    }

    .status-cancelled i {
      color: #dc3545;
    }

    .status-label {
      font-weight: 600;
      font-size: 15px;
      color: #2c3e50;
      flex: 1;
    }

    .status-description {
      font-size: 13px;
      color: #6c757d;
      font-style: italic;
    }

    .no-changes {
      text-align: center;
      padding: 30px 20px;
      background: #fff3cd;
      border-radius: 8px;
      margin-top: 10px;
    }

    .no-changes i {
      font-size: 32px;
      color: #856404;
      margin-bottom: 10px;
    }

    .no-changes p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }

    mat-dialog-actions {
      padding: 16px 20px;
      gap: 8px;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 300px;
      }

      .status-option-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class ChangeOrderStatusDialogComponent {
  data = inject<ChangeOrderStatusData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ChangeOrderStatusDialogComponent>);

  selectedStatus: OrderStatus | null = null;
  availableStatuses: Array<{
    value: OrderStatus;
    label: string;
    icon: string;
    description?: string;
  }> = [];

  constructor() {
    this.calculateAvailableStatuses();
  }

  private calculateAvailableStatuses(): void {
    const current = this.data.currentStatus as OrderStatus;

    // Definir todos los estados posibles
    const allStatuses = [
      {
        value: 'pending' as OrderStatus,
        label: 'Pendiente',
        icon: 'fa-clock',
        description: 'Orden recibida, esperando procesamiento'
      },
      {
        value: 'processing' as OrderStatus,
        label: 'En preparación',
        icon: 'fa-box-open',
        description: 'Orden en proceso de preparación'
      },
      {
        value: 'delivered' as OrderStatus,
        label: 'Entregado',
        icon: 'fa-check-circle',
        description: 'Orden entregada al cliente'
      },
      {
        value: 'cancelled' as OrderStatus,
        label: 'Cancelado',
        icon: 'fa-times-circle',
        description: 'Orden cancelada'
      }
    ];

    // Lógica de estados disponibles según el estado actual
    // Solo incluir estados a los que se puede cambiar
    switch (current) {
      case 'pending':
        // Desde pending puede ir a processing o cancelled
        this.availableStatuses = allStatuses.filter(status => 
          status.value === 'processing' || status.value === 'cancelled'
        );
        break;

      case 'processing':
        // Desde processing puede ir a delivered o cancelled
        this.availableStatuses = allStatuses.filter(status => 
          status.value === 'delivered' || status.value === 'cancelled'
        );
        break;

      case 'delivered':
        // Desde delivered no puede cambiar a ningún estado
        this.availableStatuses = [];
        break;

      case 'cancelled':
        // Desde cancelled podría volver a pending o processing
        this.availableStatuses = allStatuses.filter(status => 
          status.value === 'pending' || status.value === 'processing'
        );
        break;

      default:
        this.availableStatuses = [];
    }
  }

  hasAvailableStatuses(): boolean {
    return this.availableStatuses.length > 0;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'En preparación',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  onConfirm(): void {
    if (this.selectedStatus && this.selectedStatus !== this.data.currentStatus) {
      this.dialogRef.close(this.selectedStatus);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}