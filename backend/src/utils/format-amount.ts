export function formatAmount(amount: number, orderOrRegion: any): string {
  // Support both order and region objects
  const currencyCode = orderOrRegion?.currency_code || orderOrRegion?.region?.currency_code || 'USD';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  })

  // Amount is already in the correct unit (dollars)
  return formatter.format(amount)
}
