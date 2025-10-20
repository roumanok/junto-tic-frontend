import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

export interface StockDialogData {
  mode: 'add' | 'update';
  currentStock: number;
  listingTitle: string;
}

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'add' ? 'Agregar Stock' : 'Actualizar Stock' }}
    </h2>
    
    <mat-dialog-content>
      <p class="listing-title">{{ data.listingTitle }}</p>
      
      @if (data.mode === 'update') {
        <p class="current-stock">{{ 'PAGES.MY_LISTINGS.CURRENT_STOCK' | translate }}: <strong>{{ data.currentStock }}</strong></p>
      }

      <form [formGroup]="stockForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>
            {{ data.mode === 'add' ? ('PAGES.MY_LISTINGS.STOCK_TO_ADD' | translate) : ('PAGES.MY_LISTINGS.STOCK_TO_UPDATE' | translate) }}
          </mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="quantity"
            min="0"
            [placeholder]="data.mode === 'add' ? 'Ej: 10' : 'Ej: 25'">
          @if (stockForm.get('quantity')?.hasError('required')) {
            <mat-error>{{ 'COMMON.REQUIRED_FIELD' | translate }}</mat-error>
          }
          @if (stockForm.get('quantity')?.hasError('min')) {
            <mat-error>{{ 'COMMON.POSITIVE_NUMBER' | translate }}</mat-error>
          }
        </mat-form-field>

        @if (data.mode === 'add' && stockForm.get('quantity')?.value) {
          <p class="stock-preview">
            {{ 'PAGES.MY_LISTINGS.NEW_STOCK' | translate}}: <strong>{{ data.currentStock + (stockForm.get('quantity')?.value || 0) }}</strong>
          </p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ 'COMMON.CANCEL' | translate }}
      </button>
      <button 
        mat-raised-button 
        color="primary"
        [disabled]="!stockForm.valid"
        (click)="onConfirm()">
        {{ data.mode === 'add' ? ('PAGES.MY_LISTINGS.ADD_STOCK' | translate) : ('PAGES.MY_LISTINGS.UPDATE_STOCK' | translate) }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      padding: 20px 0;
    }

    .listing-title {
      font-size: 14px;
      color: var(--text-primary);
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .current-stock {
      font-size: 14px;
      color: var(--text-primary);
      margin: 0 0 20px 0;

      strong {
        color: var(--color-primary);
        font-size: 16px;
      }
    }

    .full-width {
      width: 100%;
    }

    .stock-preview {
      margin: 16px 0 0 0;
      padding: 12px;
      background-color: var(--bg-page-section);
      border-radius: 4px;
      font-size: 14px;
      color: var(--text-primary);

      strong {
        color: var(--color-primary);
        font-size: 16px;
      }
    }

    mat-dialog-actions {
      padding: 8px 0;
      gap: 8px;
    }
  `]
})
export class StockDialogComponent {
  data = inject<StockDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<StockDialogComponent>);
  private fb = inject(FormBuilder);

  stockForm: FormGroup;

  constructor() {
    const initialValue = this.data.mode === 'update' ? this.data.currentStock : 0;
    
    this.stockForm = this.fb.group({
      quantity: [initialValue, [Validators.required, Validators.min(0)]]
    });
  }

  onConfirm(): void {
    if (this.stockForm.valid) {
      this.dialogRef.close(this.stockForm.get('quantity')?.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}