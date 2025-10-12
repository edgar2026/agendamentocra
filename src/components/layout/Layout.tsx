import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDialog } from "./NotificationDialog";
import { useState, useEffect } from "react";

const pageTitles: { [key: string]: string } = {
  "/": "Painel de Atendimentos",
  "/dashboard": "Dashboard Gerencial",
  "/admin": "Painel Administrativo",
  "/filtrar-historico": "Histórico de espontâneo sem nº do chamado",
  "/alunos": "Pesquisar Aluno",
};

export function Layout() {
  const location = useLocation();
  const { notification, acknowledgeNotification } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsNotificationOpen(true);
    }
  }, [notification]);

  const handleAcknowledge = () => {
    if (notification) {
      acknowledgeNotification(notification.id);
      setIsNotificationOpen(false);
    }
  };

  const title = pageTitles[location.pathname] || "UNINASSAU";

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={title} />
      <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
        <Outlet />
      </main>
      <Footer />
      {notification && (
        <NotificationDialog
          notification={notification}
          open={isNotificationOpen}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  );
}