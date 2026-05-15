import { API_ROUTES } from '@/constants/api-routes'
import { apiRequest } from '@/services/api-client'
import type { PaginatedResponse } from '@/types/api'
import { appendOptionalQueryValue, appendSorts } from '@/utils/api-helpers'
import type { Appointment, AppointmentQueryInput, BookAppointmentInput } from '../types/appointments'

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
