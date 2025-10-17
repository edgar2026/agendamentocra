export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-card border-t border-border mt-auto py-4 shadow-sm"> {/* Usando bg-card e border-border */}
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>© {currentYear} UNINASSAU. Todos os direitos reservados.</p>
        <p>Desenvolvido por Edgar Tavares.</p>
      </div>
    </footer>
  );
}