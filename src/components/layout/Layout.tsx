import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useTheme } from "@/contexts/ThemeContext"; // Import useTheme

const pageTitles: { [key: string]: string } = {
  "/": "Painel de Atendimentos",
  "/dashboard": "Dashboard Gerencial",
  "/admin": "Painel Administrativo",
};

export function Layout() {
  const location = useLocation();
  const { currentTheme } = useTheme(); // Use o hook useTheme

  const title = pageTitles[location.pathname] || "UNINASSAU";

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={title} />
      <main
        className="flex-1 overflow-auto p-4 md:p-6"
        style={{
          backgroundColor: `hsl(${currentTheme.background.hue} ${currentTheme.background.saturation}% ${currentTheme.background.lightness}%)`,
          transition: 'background-color 0.5s ease-in-out', // Adiciona transição suave
        }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}