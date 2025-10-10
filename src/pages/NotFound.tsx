import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-6">
      <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-4 text-2xl font-semibold text-foreground">Página não encontrada</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Oops! A página que você está procurando não existe. Pode ter sido movida ou excluída.
      </p>
      <Button asChild>
        <Link to="/">Voltar para o Início</Link>
      </Button>
    </div>
  );
};

export default NotFound;