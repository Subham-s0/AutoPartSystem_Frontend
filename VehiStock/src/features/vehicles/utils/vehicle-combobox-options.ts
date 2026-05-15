import type { SearchableComboboxOption } from '@/components/shared/searchable-combobox'
import type { CustomerVehicle } from '@/features/vehicles/types/vehicles'

/** Keeps the selected row visible when server-side search filters it out of the current page of results. */
export function mergeSelectedVehicleForCombobox(
  vehicles: CustomerVehicle[],
  selected: CustomerVehicle | null,
): CustomerVehicle[] {
  if (!selected) {
    return vehicles
  }

  if (vehicles.some((v) => v.vehicleId === selected.vehicleId)) {
    return vehicles
  }

  return [selected, ...vehicles]
}

export function buildCustomerVehicleComboboxOptions(
  vehicles: CustomerVehicle[],
  options: { includeGeneric?: boolean } = {},
): SearchableComboboxOption[] {
  const { includeGeneric = false } = options
  const rows: SearchableComboboxOption[] = []

  if (includeGeneric) {
    rows.push({
      value: '',
      label: 'General request (no vehicle)',
      searchText: 'general any vehicle none not applicable',
      secondaryText: 'Part request not tied to a registration',
    })
  }

  for (const vehicle of vehicles) {
    rows.push({
      value: String(vehicle.vehicleId),
      label: `${vehicle.vehicleNumber} — ${vehicle.make} ${vehicle.model}`,
      searchText: `${vehicle.vehicleNumber} ${vehicle.make} ${vehicle.model} ${vehicle.manufactureYear} ${vehicle.engineNo ?? ''} ${vehicle.chassisNo ?? ''}`,
      secondaryText: `${vehicle.manufactureYear} · ${vehicle.mileageKm.toLocaleString()} km`,
    })
  }

  return rows
}
