import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/auth/Login";
import JoinCouple from "./components/auth/JoinCouple";

function ProtectedRoute({ children }) {
  const { user, coupleId, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-luvio-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-coral-400 to-amber-400 bg-clip-text text-transparent">
            luvio
          </h1>
          <p className="text-zinc-600 text-sm mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (!coupleId) return <Navigate to="/join" />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="dark min-h-screen bg-luvio-bg font-sans">
          <div className="max-w-[430px] mx-auto relative">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/join" element={<JoinCouple />} />
              <Route path="/join/:code" element={<JoinCouple />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
