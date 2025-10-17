import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PinkOctoberBanner } from "./PinkOctoberBanner"; // Importando o banner

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
      
      {/* O Banner agora é fixo e aparece logo abaixo do Header. 
          Usamos mt-16 para empurrá-lo para baixo do Header (h-16). */}
      <div className="fixed top-16 w-full z-20 bg-background">
        <PinkOctoberBanner />
      </div>

      {/* O padding superior deve compensar o Header (h-16) + o Banner (aprox. h-12 + mb-6) */}
      {/* h-16 (4rem) + h-12 (3rem) = 7rem. Usaremos pt-32 (8rem) para garantir espaço. */}
      <main className="flex-1 bg-background p-4 md:p-6 pt-32 pb-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}