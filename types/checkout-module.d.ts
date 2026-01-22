declare module '/assets/js/modules/checkout.js' {
  export function runCheckout(opts?: any): Promise<void>;
  export function parseCartRaw(raw: any): any;
  export function computeGrandTotal(cart: any): number;
  export default any;
}

declare global {
  interface Window {
    NaturesCart?: any;
  }
}

export {};
