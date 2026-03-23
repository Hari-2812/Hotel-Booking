import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function RequireAuth({ children, roles }) {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-6 text-center text-gray-600">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (roles?.length && user?.role && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

