import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import { PageSkeleton } from './components/LoadingSkeleton';

const HomePage = lazy(() => import('./pages/HomePage'));
const RoomDetailsPage = lazy(() => import('./pages/RoomDetailsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const RoomReviewsPage = lazy(() => import('./pages/RoomReviewsPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms/:id" element={<RoomDetailsPage />} />
            <Route path="/rooms/:id/book" element={<BookingPage />} />
            <Route path="/booking/confirmation" element={<RequireAuth><BookingConfirmationPage /></RequireAuth>} />
            <Route path="/rooms/:roomId/reviews" element={<RoomReviewsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminDashboardPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
