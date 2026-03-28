export function hasPayPalReturnParams(searchString) {
  try {
    const params = new URLSearchParams(
      searchString || (typeof location !== 'undefined' ? location.search : '')
    );
    return ['PayerID', 'tx', 'paymentId', 'token'].some((k) => params.has(k));
  } catch (e) {
    return false;
  }
}
