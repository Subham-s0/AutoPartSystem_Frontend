import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue, appendSorts } from '@/utils/api-helpers'
import type { Appointment, AppointmentQueryInput, BookAppointmentInput, StaffAppointment } from '../types/appointments'
export type { StaffAppointment }

export function getAppointments(query: AppointmentQueryInput = {}) {
  const searchParams = new URLSearchParams({
    pageNumber: String(query.pageNumber ?? 1),
    pageSize: String(query.pageSize ?? 10),
  })

  appendOptionalQueryValue(searchParams, 'searchText', query.searchText)
  appendOptionalQueryValue(searchParams, 'status', query.status)
  appendSorts(searchParams, query.sorts)

  return apiRequest<PaginatedResponse<Appointment>>(
    `${API_ROUTES.customer.appointments}?${searchParams.toString()}`,
  )
}

export function getAppointmentDetail(appointmentId: number) {
  return apiRequest<Appointment>(API_ROUTES.customer.appointmentDetail(appointmentId))
}

export function bookAppointment(input: BookAppointmentInput) {
  return apiRequest<Appointment>(API_ROUTES.customer.appointments, {
    method: 'POST',
    body: input,
  })
}

export function cancelAppointment(appointmentId: number) {
  return apiRequest<Appointment>(
    `${API_ROUTES.customer.appointments}/${appointmentId}/cancel`,
    {
      method: 'PATCH',
    },
  )
}

export function getStaffAppointments(pageNumber: number, pageSize: number, status?: string, searchText?: string) {
  const searchParams = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })

  if (status) {
    searchParams.append('status', status)
  }
  if (searchText?.trim()) {
    searchParams.append('searchText', searchText.trim())
  }

  return apiRequest<PaginatedResponse<StaffAppointment>>(
    `${API_ROUTES.staff.appointments}?${searchParams.toString()}`,
  )
}

export function updateAppointmentStatus(appointmentId: number, status: string) {
  return apiRequest<void>(`${API_ROUTES.staff.appointments}/${appointmentId}/status`, {
    method: 'PUT',
    body: { status },
  })
}

export function assignStaffToAppointment(appointmentId: number, staffId: number) {
  return apiRequest<void>(`${API_ROUTES.staff.appointments}/${appointmentId}/assign`, {
    method: 'POST',
    body: { staffId },
  })
}

export interface CreateServiceRecordRequest {
  appointmentId: number
  diagnosis: string
  workDone: string
  laborCharge: number
  partsCharge: number
  notes?: string
}

export async function createServiceRecordFromAppointment(data: CreateServiceRecordRequest) {
  return apiRequest<any>(`${API_ROUTES.staff.serviceRecords}/from-appointment`, {
    method: 'POST',
    body: data,
  })
}
