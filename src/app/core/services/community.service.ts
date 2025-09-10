import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Community, CommunityInfo } from '../models/community.model';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private currentCommunitySubject = new BehaviorSubject<Community | null>(null);
  public currentCommunity$ = this.currentCommunitySubject.asObservable();
  private detectedDomain = 'tubarrio.com.ar';
  
  // Datos estáticos para evitar loops
  private readonly communityInfo: CommunityInfo = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Tu Barrio',
    slug: 'tubarrio',
    domain: 'tubarrio.com.ar',
    isActive: true
  };

  constructor() {
    console.log('Using mock domain for development:', this.detectedDomain);
    this.initializeCommunity();
  }

  private initializeCommunity(): void {
    const community: Community = {
      id: this.communityInfo.id,
      slug: this.communityInfo.slug,
      name: this.communityInfo.name,
      domain: this.communityInfo.domain,
      version: 1,
      isActive: this.communityInfo.isActive
    };
    
    this.setCurrentCommunity(community);
  }

  getCommunityInfo(): Observable<CommunityInfo> {
    console.log('CommunityService: Returning static community info');
    return of(this.communityInfo);
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