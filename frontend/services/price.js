export const CURRENCY_SYMBOL = '₹';

export function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPrice(amount) {
  return `${CURRENCY_SYMBOL}${formatMoney(amount)}`;
}

export function formatPriceCompact(amount) {
  const value = Number(amount || 0);
  return `${CURRENCY_SYMBOL}${value % 1 === 0 ? value.toLocaleString('en-IN') : value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
