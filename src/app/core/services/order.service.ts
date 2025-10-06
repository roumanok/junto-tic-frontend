import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, map } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { OrderDetail } from '../../core/models/order-detail.model';

interface OrderListResponse {
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiService = inject(ApiService);

  /**
   * Obtener listado de órdenes del usuario
   */
  getUserOrders(page: number = 1, limit: number = 10): Observable<OrderListResponse> {
    const params = new HttpParams()
              .set('page', page)
              .set('limit', limit);
    return this.apiService.getSimple<OrderListResponse>('/checkout/orders', params).pipe(
      tap((response) => {
        console.log('📋 Orders loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting user orders:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalle completo de una orden
   */
  getOrderDetail(orderId: string): Observable<OrderDetail> {
    return this.apiService.getSimple<OrderDetail>(`/checkout/orders/${orderId}`).pipe(
      tap((response) => {
        console.log('✅ Order detail loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting order detail:', error);
        throw error;
      })
    );
  }
}