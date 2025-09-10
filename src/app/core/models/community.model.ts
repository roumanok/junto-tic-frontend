export interface Community {
  id: string; 
  slug: string;
  name: string;
  domain: string;
  version: number;
  isActive: boolean;
}

export interface CommunityInfo {
  id: string;
  name: string;
  slug: string;
  domain: string;
  isActive: boolean;
}

export interface CommunityTheme {
  communitySlug: string;
  version: number;
  assets: {
    logo: string;
    favicon: string;
  };
  customCSS?: string;
  customJS?: string;
  i18nOverride?: string;
  slider?: string;
  categoryImages?: Record<string, string>;
}