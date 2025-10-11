import { Link, useLocation } from "react-router-dom";
import { UserNav } from "@/components/layout/UserNav";
import { Home, LayoutDashboard, Settings, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Clock } from "@/components/layout/Clock";
import { useTheme } from "@/contexts/ThemeContext"; // Import useTheme

const navItems = [
  { href: "/", label: "Atendimentos", icon: Home, roles: ['ADMIN', 'ATENDENTE', 'TRIAGEM'] },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'ATENDENTE', 'TRIAGEM'] },
  { href: "/admin", label: "Administração", icon: Settings, roles: ['ADMIN'] },
];

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { currentTheme } = useTheme(); // Use o hook useTheme

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <span className="text-2xl">{currentTheme.emoji}</span> {/* Exibir o emoji do tema */}
          <span>UNINASSAU</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => {
            if (!profile || !item.roles.includes(profile.role)) {
              return null;
            }

            const commonClasses = "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground";
            const activeClasses = location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground";

            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(commonClasses, activeClasses)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Clock />
        <UserNav />
      </div>
    </header>
  );
}