import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { prefetchRates } from "./utils/exchangeRates";

// Precargar tipos de cambio al arrancar (se actualiza si caché > 24h)
prefetchRates();
import Dashboard from "./components/dashboard/Dashboard";
import Login from "./components/auth/Login";
import JoinCouple from "./components/auth/JoinCouple";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-luvio-bg flex items-center justify-center">
      <div className="text-center">
        <img src="/logo.jpg" alt="luvio" className="h-12 w-auto mx-auto mix-blend-multiply brightness-110" />
        <p className="text-luvio-warm500 text-sm mt-2 font-sans">Cargando...</p>
      </div>
    </div>
  );
}

// Ruta protegida: requiere login + pareja vinculada
function ProtectedRoute({ children }) {
  const { user, coupleId, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!coupleId) return <Navigate to="/join" />;
  return children;
}

// Guard para /join: si ya tienes pareja, ir al Dashboard directamente
function JoinGuard({ children }) {
  const { user, coupleId, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (coupleId) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-luvio-bg font-sans text-luvio-text">
          <div className="max-w-[430px] mx-auto relative">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/join" element={<JoinGuard><JoinCouple /></JoinGuard>} />
              <Route path="/join/:code" element={<JoinGuard><JoinCouple /></JoinGuard>} />
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
