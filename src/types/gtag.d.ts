declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

declare function gtag(...args: any[]): void;

export {};