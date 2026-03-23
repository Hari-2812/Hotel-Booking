import { api } from './api';

export async function createBookingIntent(payload) {
  const response = await api.post('/api/bookings/create', payload);
  return response.data;
}

export async function confirmPayment(payload) {
  const response = await api.post('/api/payments/stripe/confirm', payload);
  return response.data;
}

export async function getMyBookings({ page = 1, limit = 10 } = {}) {
  const response = await api.get('/api/bookings/mine', { params: { page, limit } });
  return response.data;
}

export async function cancelMyBooking(bookingId) {
  const response = await api.delete(`/api/bookings/${bookingId}/cancel`);
  return response.data;
}

export async function modifyMyBooking(bookingId, payload) {
  const response = await api.put(`/api/bookings/${bookingId}/modify`, payload);
  return response.data;
}
