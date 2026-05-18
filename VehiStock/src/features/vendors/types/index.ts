export interface Vendor {
  vendorId: number
  vendorName: string
  vendorCode: string
  contactPerson: string
  email: string
  phoneNumber: string
  address: string
}

export interface VendorUpsertRequest {
  vendorName: string
  vendorCode: string
  contactPerson: string
  email: string
  phoneNumber: string
  address: string
}
