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
  assets: CommunityAssetsConfig;
  menuItems: CommunityMenuItemsConfig;
  homeSections: CommunityHomeSectionsConfig
  i18n: Dict<string>;
  slider: { slides: Array<CommunitySlide> };
  gtmContainerId?: string;
  ready: boolean;
}

export interface CommunityAssetsConfig {
  logo?: string;
  favicon?: string;
}

export interface CommunityMenuItemsConfig {
  news?: boolean;
  offers?: boolean;
  sellerSignup?: boolean;
}

export interface CommunityHomeSectionsConfig {
  heroSlider?: boolean,
  heroText?: boolean,
  highlights?: boolean,
  categories?: boolean,
  advertisers?: boolean,
  newsStrip?: boolean,
  offersStrip?: boolean
}

export interface CommunitySlide{
  image: string;
  imageMobile?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}
