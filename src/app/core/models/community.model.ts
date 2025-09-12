export interface Community {
  id: string; 
  slug: string;
  name: string;
  cdn_domain: string;
  gen_version: number;
  res_version: number;
}

type Dict<T = any> = Record<string, T>;
export interface CommunityTheme {
  slug: string;
  genVersion: number;
  resVersion: number;
  cdn: string; 
  assets: {
    logo?: string;
    favicon?: string;
  };
  i18n: Dict<string>;
  slider: { slides: Array<{ image: string; title?: string; link?: string }> };
  ready: boolean;
}