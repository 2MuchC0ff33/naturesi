declare module '/assets/js/modules/*' {
  const m: any;
  export default m;
}

declare module '/assets/js/modules/checkout.js' {
  const m: any;
  export default m;
}

declare global {
  interface Window {
    NaturesCart?: any;
  }
}

export {};
