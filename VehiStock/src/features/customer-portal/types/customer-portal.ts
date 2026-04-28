export interface CustomerVehicle {
  vehicleId: number
  vehicleNumber: string
  make: string
  model: string
  manufactureYear: number
  mileageKm: number
  vehiclePhotoUrl?: string | null
}

export interface Appointment {
  appointmentId: number
  vehicleId: number
  vehicleNumber: string
  preferredDate: string
  serviceType: string
  problemDescription: string
  status: string
  bookedAt: string
}

export interface BookAppointmentInput {
  vehicleId: number
  preferredDate: string
  serviceType: string
  problemDescription: string
}

export interface PartRequest {
  partRequestId: number
  vehicleId?: number | null
  vehicleNumber?: string | null
  requestedPartName: string
  quantity: number
  details?: string | null
  status: string
  requestDate: string
}

export interface CreatePartRequestInput {
  vehicleId?: number | null
  requestedPartName: string
  quantity: number
  details?: string
}

export interface Review {
  reviewId: number
  serviceRecordId: number
  rating: number
  reviewText: string
  createdAt: string
}

export interface CreateReviewInput {
  serviceRecordId: number
  rating: number
  reviewText: string
}

export interface PurchaseHistoryItem {
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  discountAmount: number
  lineTotal: number
}

export interface PurchaseHistory {
  salesInvoiceId: number
  invoiceNo: string
  invoiceDate: string
  vehicleNumber: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
  items: PurchaseHistoryItem[]
}

export interface ServiceHistoryPart {
  partName: string
  brand: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface ServiceHistory {
  serviceRecordId: number
  serviceDate: string
  vehicleNumber: string
  diagnosis: string
  workDone: string
  laborCharge: number
  partsCharge: number
  totalCharge: number
  notes?: string | null
  partsUsed: ServiceHistoryPart[]
  review?: Review | null
}

export interface CustomerHistory {
  purchases: PurchaseHistory[]
  services: ServiceHistory[]
}
