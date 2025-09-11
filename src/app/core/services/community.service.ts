import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Community } from '../models/community.model';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private currentCommunitySubject = new BehaviorSubject<Community | null>(null);
  public currentCommunity$ = this.currentCommunitySubject.asObservable();
  private detectedDomain = environment.cmDomain;
  
  constructor(private apiService: ApiService) {
    this.detectCommunityFromDomain();
  }

  private detectCommunityFromDomain(): void {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Extraer subdomain
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        // Formato: subdomain.domain.com
        this.detectedDomain = parts[0];
      } else if (parts.length === 2) {
        // Formato: domain.com - usar dominio completo
        this.detectedDomain = hostname;
      }

      console.log('Detected domain:', this.detectedDomain);

      this.getCommunityByDomain(this.detectedDomain).subscribe(community => {
        if (community) {
          this.setCurrentCommunity(community);
        }
      });
            
    }
  }

  // Signals para manejo de estado
  private loading = signal(false);
  private error = signal<string | null>(null);  

  // Getters públicos para los signals
  get isLoading() { return this.loading.asReadonly(); }
  get errorMessage() { return this.error.asReadonly(); }

  getCommunityByDomain(domain?: string): Observable<Community | undefined> {
    this.loading.set(true);
    this.error.set(null); 

    const targetDomain = domain || this.detectedDomain;
    
    if (!targetDomain) {
      return of(undefined);
    }

    const params = new HttpParams().set('domain', targetDomain);
    
    return this.apiService.getSimple<Community>('/communities/info', params)
      .pipe(
        map(response => {
          console.log('Community fetched:', response);
          return response}),
        catchError(error => {
          console.error('Error getting community by domain:', error);
          return of(undefined);
        }),
        tap(() => this.loading.set(false))
      );
  }

  getCurrentCommunity(): Community | null {
    return this.currentCommunitySubject.value;
  }

  setCurrentCommunity(community: Community): void {
    this.currentCommunitySubject.next(community);
  }

  getDetectedDomain(): string {
    return this.detectedDomain;
  }
}