import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, map } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { OrderDetail, OrdersResponse } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiService = inject(ApiService);

  /**
   * Obtener listado de órdenes del usuario
   */
  getUserOrders(page: number = 1, limit: number = 10): Observable<OrdersResponse> {
    const params = new HttpParams()
              .set('page', page)
              .set('limit', limit);
    return this.apiService.getSimple<OrdersResponse>('/checkout/orders', params).pipe(
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

  /**
   * Obtener listado de ventas del anunciante
   */
  getMySales(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
              .set('page', page)
              .set('limit', limit);
    return this.apiService.getSimple<any>('/my-sales/', params).pipe(
      tap((response) => {
        console.log('📋 Sales loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting my sales:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener detalle completo de una venta
   */
  getSaleDetail(orderId: string): Observable<OrderDetail> {
    return this.apiService.getSimple<OrderDetail>(`/my-sales/${orderId}`).pipe(
      tap((response) => {
        console.log('✅ Sale detail loaded:', response);
      }),
      catchError((error) => {
        console.error('Error getting sale detail:', error);
        throw error;
      })
    );
  }  
}