import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

const pageTitles: { [key: string]: string } = {
  "/": "Painel de Atendimentos",
  "/dashboard": "Dashboard Gerencial",
  "/admin": "Painel Administrativo",
  "/filtrar-historico": "Histórico de espontâneo sem nº do chamado",
  "/alunos": "Consultas",
};

export function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "UNINASSAU";

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={title} />
      <main className="flex-1 bg-background p-4 md:p-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}