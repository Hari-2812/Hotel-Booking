import { api } from "./api";

export async function createBookingIntent({ roomId, checkIn, checkOut, guests }) {
  const res = await api.post("/api/bookings/create", { roomId, checkIn, checkOut, guests });
  return res.data;
}

export async function confirmPayment({ bookingId, paymentIntentId }) {
  const res = await api.post("/api/payments/stripe/confirm", { bookingId, paymentIntentId });
  return res.data;
}

export async function getMyBookings({ page = 1, limit = 10 } = {}) {
  const res = await api.get("/api/bookings/mine", { params: { page, limit } });
  return res.data;
}

export async function cancelMyBooking(bookingId) {
  const res = await api.delete(`/api/bookings/${bookingId}/cancel`);
  return res.data;
}

