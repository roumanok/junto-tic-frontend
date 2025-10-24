import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, map } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { OrderDetail, OrdersResponse, SalesResponse, RetryPaymentResponse } from '../models/order.model';
import { I18nService } from './i18n.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiService = inject(ApiService);
  private i18n = inject(I18nService);

  getUserOrders(page: number = 1, limit: number = 10): Observable<OrdersResponse> {
    const params = new HttpParams()
              .set('page', page)
              .set('limit', limit);
    return this.apiService.getSimple<OrdersResponse>('/checkout/orders', params).pipe(
      tap((response) => {
        //console.log('Orders loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting user orders:', error);
        throw error;
      })
    );
  }

  getOrderDetail(orderId: string): Observable<OrderDetail> {
    return this.apiService.getSimple<OrderDetail>(`/checkout/orders/${orderId}`).pipe(
      tap((response) => {
        //console.log('Order detail loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting order detail:', error);
        throw error;
      })
    );
  }

  getMySales(page: number = 1, limit: number = 10): Observable<SalesResponse> {
    const params = new HttpParams()
              .set('page', page)
              .set('limit', limit);
    return this.apiService.getSimple<SalesResponse>('/my-sales/', params).pipe(
      tap((response) => {
        //console.log('Sales loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting my sales:', error);
        throw error;
      })
    );
  }

  getSaleDetail(orderId: string): Observable<OrderDetail> {
    return this.apiService.getSimple<OrderDetail>(`/my-sales/${orderId}`).pipe(
      tap((response) => {
        //console.log('Sale detail loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting sale detail:', error);
        throw error;
      })
    );
  }  

  updateOrderStatus(orderId: string, newStatus: string): Observable<any> {
    return this.apiService.put<any>(`/my-sales/${orderId}/status`, { 
      status: newStatus 
    }).pipe(
      tap((response) => {
        //console.log('Order status updated:', response);
      }),
      catchError((error) => {
        console.error('Error updating order status:', error);
        throw error;
      })
    );
  }

  retryPayment(paymentId: string): Observable<RetryPaymentResponse> {
    return this.apiService.post<RetryPaymentResponse>(
      `/payments/pagotic/retry-payment/${paymentId}`,
      { payment_id: paymentId }
    ).pipe(
      tap((response) => {
        console.log('Payment retry initiated:', response);
      }),
      map((response: any) => {
          if (response.items !== undefined) {
            return response.items;
          }
          return response;
      }),
      catchError((error) => {
        console.error('Error retrying payment:', error);
        throw error;
      })
    );
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': this.i18n.t('ORDER.STATUS.PENDING'),
      'processing': this.i18n.t('ORDER.STATUS.PROCESSING'),
      'delivered': this.i18n.t('ORDER.STATUS.DELIVERED'),
      'cancelled': this.i18n.t('ORDER.STATUS.CANCELLED')
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': this.i18n.t('ORDER.PAYMENT_STATUS.PENDING'),
      'issued': this.i18n.t('ORDER.PAYMENT_STATUS.ISSUED'),
      'in_process': this.i18n.t('ORDER.PAYMENT_STATUS.IN_PROCESS'),
      'approved': this.i18n.t('ORDER.PAYMENT_STATUS.APPROVED'),
      'rejected': this.i18n.t('ORDER.PAYMENT_STATUS.REJECTED'),
      'cancelled': this.i18n.t('ORDER.PAYMENT_STATUS.CANCELLED'),
      'refunded': this.i18n.t('ORDER.PAYMENT_STATUS.REFUNDED'),
      'deferred': this.i18n.t('ORDER.PAYMENT_STATUS.DEFERRED'),
      'objected': this.i18n.t('ORDER.PAYMENT_STATUS.OBJECTED'),
      'review': this.i18n.t('ORDER.PAYMENT_STATUS.REVIEW'),
      'validate': this.i18n.t('ORDER.PAYMENT_STATUS.VALIDATE'),
      'overdue': this.i18n.t('ORDER.PAYMENT_STATUS.OVERDUE')
    };
    return labels[status] || status;
  }

  getCustomerIdentificationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'DNI_ARG': this.i18n.t('COMMON.DNI'),
      'CUIT_ARG': this.i18n.t('COMMON.CUIT')      
    };
    return labels[type] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(environment.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(environment.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}