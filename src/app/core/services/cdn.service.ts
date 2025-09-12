import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommunityService } from './community.service';

@Injectable({
  providedIn: 'root'
})
export class CdnService {  
  constructor(
    private communityService: CommunityService
  ) {}
  
  getCdnUrl(fileUrl: string = ''): string {
    const cdnUrl = this.communityService.getCdnUrl();
    return (cdnUrl || environment.cdnUrl) + fileUrl;
  }    
  
}