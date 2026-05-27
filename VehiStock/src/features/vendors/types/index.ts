export interface Vendor {
  vendorId: number
  vendorName: string
  vendorCode: string
  contactPerson: string
  email: string
  phone: string
  address: string
}

export interface VendorUpsertRequest {
  vendorName: string
  vendorCode: string
  contactPerson: string
  email: string
  phone: string
  address: string
}
