export interface CustomerDeskDetails {
  customerId: number
  fullname: string
  phone: string
  email?: string
  vehicles?: string[] | null
}

export interface CustomerDeskHistory {
  partName: string
  quantity: number
  totalPrice: number
  date: string
}

export interface SellPartInput {
  customerId: number
  partId: number
  quantity: number
  vehicleID: number
}
