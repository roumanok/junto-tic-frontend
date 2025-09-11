export interface Community {
  id: string; 
  slug: string;
  name: string;
  cdn_domain: string;
  gen_version: number;
  res_version: number;
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