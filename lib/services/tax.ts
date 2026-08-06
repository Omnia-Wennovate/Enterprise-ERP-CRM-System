'use server'

export async function calculateTax(amount: number, taxRatePercent: number = 0): Promise<number> {
  return amount * (taxRatePercent / 100);
}

export async function calculateDiscount(amount: number, discountPercent: number = 0): Promise<number> {
  return amount * (discountPercent / 100);
}
