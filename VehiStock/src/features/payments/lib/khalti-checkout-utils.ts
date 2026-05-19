export function canPayKhaltiInvoice(paymentStatus: string, balanceDue: number) {
  return balanceDue > 0 && paymentStatus !== 'Paid' && paymentStatus !== 'Cancelled'
}
