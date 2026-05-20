export interface Part {
  partId: number
  partCategoryId: number
  categoryName: string
  partCode: string
  partName: string
  brand: string
  partPhotoUrl?: string | null
  unitCost: number
  unitPrice: number
  stockQty: number
  minimumStock: number
  isActive: boolean
}

export interface PartUpsertRequest {
  partCategoryId: number
  partName: string
  brand: string
  partPhotoUrl?: string
  unitCost: number
  unitPrice: number
  stockQty: number
  minimumStock: number
}

export interface PartCategory {
  partCategoryId: number
  name: string
}
