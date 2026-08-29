/** Ghana Cedis (GHS) formatting */
export const CURRENCY_SYMBOL = '₵';
export const CURRENCY_CODE = 'GHS';

export function formatMoney(amount, { decimals = 2 } = {}) {
  const num = Number(amount) || 0;
  return `${CURRENCY_SYMBOL}${num.toLocaleString('en-GH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
