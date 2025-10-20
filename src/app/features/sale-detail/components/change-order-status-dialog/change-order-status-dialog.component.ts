import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { OrderStatus } from 'src/app/core/models/order.model';
import { I18nService } from 'src/app/core/services/i18n.service';
import { OrderService } from 'src/app/core/services/order.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

export interface ChangeOrderStatusData {
  currentStatus: string;
  orderId: string;
  publicId: string;
}

@Component({
  selector: 'app-change-order-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    TranslatePipe
  ],
  templateUrl: './change-order-status-dialog.component.html',
  styleUrl: './change-order-status-dialog.component.css'
})

export class ChangeOrderStatusDialogComponent {
  data = inject<ChangeOrderStatusData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ChangeOrderStatusDialogComponent>);
  private i18n = inject(I18nService);
  private orderService = inject(OrderService);

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
    
    const allStatuses = [
      {
        value: 'pending' as OrderStatus,
        label: this.i18n.t('ORDER.STATUS.PENDING'),
        icon: 'fa-clock',
        description: this.i18n.t('ORDER.STATUS.PENDING.DESCRIPTION')
      },
      {
        value: 'processing' as OrderStatus,
        label: this.i18n.t('ORDER.STATUS.PROCESSING'),
        icon: 'fa-box-open',
        description: this.i18n.t('ORDER.STATUS.PROCESSING_DESCRIPTION')
      },
      {
        value: 'delivered' as OrderStatus,
        label: this.i18n.t('ORDER.STATUS.DELIVERED'),
        icon: 'fa-check-circle',
        description: this.i18n.t('ORDER.STATUS.DELIVERED_DESCRIPTION')
      },
      {
        value: 'cancelled' as OrderStatus,
        label: this.i18n.t('ORDER.STATUS.CANCELLED'),
        icon: 'fa-times-circle',
        description: this.i18n.t('ORDER.STATUS.CANCELLED_DESCRIPTION')
      }
    ];

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
    return this.orderService.getStatusLabel(status);
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