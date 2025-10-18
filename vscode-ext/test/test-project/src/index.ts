export interface Item {
  id: string
  name: string
  unitPrice: number
  quantity: number
  category?: string
}

export interface Discount {
  code: string
  type: "percentage" | "fixed"
  amount: number
  appliesTo?: string[] // item ids
}

export function calculateItemTotal(item: Item): number {
  if (item.quantity < 0) throw new Error("Negative quantity")
  if (item.unitPrice < 0) throw new Error("Negative price")
  return item.unitPrice * item.quantity
}

export function applyDiscount(total: number, discount: Discount, items: Item[]): number {
  if (discount.type === "percentage") {
    if (discount.amount < 0 || discount.amount > 100)
      throw new Error("Invalid percentage discount")
    return total * (1 - discount.amount / 100)
  } else {
    return Math.max(0, total - discount.amount)
  }
}

export function calculateCartTotal(items: Item[], discount?: Discount): number {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  return discount ? applyDiscount(subtotal, discount, items) : subtotal
}

export function formatCurrency(amount: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(amount)
}