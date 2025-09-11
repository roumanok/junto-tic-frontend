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
    const community = this.communityService.getCurrentCommunity();
    const cdnUrl = community?.cdn_domain || environment.cdnUrl;
    return cdnUrl + fileUrl;
  }    
  
}