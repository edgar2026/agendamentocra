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
      {/* Aumentado pt-28 para pt-32 (8rem) para compensar o Header (h-16) + PinkOctoberBanner (aprox. h-12 + mb-6) */}
      <main className="flex-1 bg-background p-4 md:p-6 pt-32 pb-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}