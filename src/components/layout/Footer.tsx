export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="fixed bottom-0 z-30 w-full bg-card border-t border-border py-4 shadow-sm"> {/* Usando fixed bottom-0 */}
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>© {currentYear} UNINASSAU. Todos os direitos reservados.</p>
        <p>Desenvolvido por Edgar Tavares.</p>
      </div>
    </footer>
  );
}