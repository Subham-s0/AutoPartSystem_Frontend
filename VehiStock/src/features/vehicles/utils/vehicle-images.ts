import type * as React from 'react'
import { APP_CONFIG } from '@/constants/app-config'

export const DEFAULT_VEHICLE_IMAGE_SRC = '/images/default-vehicle.jpg'

export function getVehicleImageSrc(imageUrl?: string | null) {
  const value = imageUrl?.trim()

  if (!value) {
    return DEFAULT_VEHICLE_IMAGE_SRC
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  ) {
    return value
  }

  return `${APP_CONFIG.apiBaseUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

export function handleVehicleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
) {
  if (event.currentTarget.dataset.fallbackApplied === 'true') {
    return
  }

  event.currentTarget.dataset.fallbackApplied = 'true'
  event.currentTarget.src = DEFAULT_VEHICLE_IMAGE_SRC
}
