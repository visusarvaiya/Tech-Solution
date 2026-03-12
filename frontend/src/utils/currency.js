// Currency utility functions
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const formatCurrencyWithoutSymbol = (amount) => {
  if (amount === null || amount === undefined) return '0';
  return Number(amount).toLocaleString('en-IN');
};

