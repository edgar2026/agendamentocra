import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { Toaster } from "sonner";
import { useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { RoleGuard } from "./components/auth/RoleGuard";

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        {/* Rotas Protegidas com o Layout */}
        <Route element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Home />} />
          
          <Route element={<RoleGuard allowedRoles={['ADMIN', 'ATENDENTE', 'TRIAGEM', 'DEVELOPER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          
          <Route element={<RoleGuard allowedRoles={['ADMIN', 'DEVELOPER']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;