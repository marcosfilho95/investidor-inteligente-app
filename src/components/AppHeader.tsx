import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, BookOpen, Bell, Settings, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

interface AppHeaderProps {
  activePage: "dashboard" | "carteira" | "ativos" | "aprender";
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", key: "dashboard" as const },
  { label: "Carteira", icon: Wallet, href: "/carteira", key: "carteira" as const },
  { label: "Ativos", icon: PieChart, href: "/ativos", key: "ativos" as const },
  { label: "Aprender", icon: BookOpen, href: "/aprender", key: "aprender" as const },
];

export function AppHeader({ activePage }: AppHeaderProps) {
  const [userName, setUserName] = useState("IN");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name;
      if (name) setUserName(name.split(" ")[0]);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Até logo! 👋", description: "Você saiu da sua conta." });
    navigate("/login");
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logoImg} alt="Investidor Inteligente" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.key} to={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  item.key === activePage ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4" />
              <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-10 w-72 glass-card p-4 shadow-xl animate-fade-in z-50">
                <h4 className="text-sm font-semibold mb-3">Notificações</h4>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-muted/50 text-xs">
                    <p className="font-medium">📈 PETR4 subiu 2.5% hoje</p>
                    <p className="text-muted-foreground mt-0.5">Há 2 horas</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 text-xs">
                    <p className="font-medium">💰 Dividendos de BBAS3 creditados</p>
                    <p className="text-muted-foreground mt-0.5">Há 1 dia</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 text-xs">
                    <p className="font-medium">📊 Novo conteúdo na aba Aprender</p>
                    <p className="text-muted-foreground mt-0.5">Há 3 dias</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button onClick={() => toast({ title: "Configurações", description: "Em breve disponível!" })}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Settings className="h-4 w-4" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1 hover:bg-primary/30 transition-colors cursor-pointer">
              {userName.slice(0, 2).toUpperCase()}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-10 w-48 glass-card p-2 shadow-xl animate-fade-in z-50">
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-[10px] text-muted-foreground">Investidor</p>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                  <User className="h-3.5 w-3.5" /> Meu perfil
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
