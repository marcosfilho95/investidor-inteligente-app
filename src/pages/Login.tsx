import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Eye, EyeOff, Mail, Lock, ArrowRight, User, TrendingUp, Shield, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/cloudClient";
import { useToast } from "@/hooks/use-toast";

const ease = [0.16, 1, 0.3, 1] as const;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        if (!name.trim()) {
          toast({ title: "Preencha seu nome", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        toast({ title: "Conta criada com sucesso! 🎉", description: "Você já pode acessar a plataforma." });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    { icon: TrendingUp, text: "25 ativos da B3 com dados reais" },
    { icon: Bot, text: "Hodl — IA que te ajuda a investir" },
    { icon: Shield, text: "Ambiente seguro para aprender" },
  ];

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/4" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="relative z-10 text-center max-w-md"
        >
          {/* Logo with glow */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease }}
            className="relative h-20 w-20 mx-auto mb-8"
          >
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.15, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative h-20 w-20 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-2xl shadow-primary/20">
              <LayoutDashboard className="h-9 w-9 text-primary" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold mb-3 text-foreground"
          >
            Investidor <span className="text-primary">Inteligente</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-muted-foreground text-sm leading-relaxed mb-10"
          >
            Aprenda a investir com o apoio do <span className="text-primary font-semibold">Hodl</span>,
            seu assistente de IA que torna o mundo dos investimentos acessível.
          </motion.p>

          {/* Highlights */}
          <div className="space-y-3">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5, ease }}
                className="flex items-center gap-3 text-left glass-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 grid grid-cols-3 gap-3"
          >
            {[
              { label: "Ativos", value: "25" },
              { label: "Indicadores", value: "20+" },
              { label: "Trilhas", value: "6" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-3 text-center">
                <p className="text-lg font-bold font-mono text-primary">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle glow on form side */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-2 mb-8 lg:hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Investidor Inteligente</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold mb-1 text-foreground">
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {isLogin ? "Entre para acessar sua carteira" : "Comece sua jornada de investimentos"}
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
                <div className={`relative rounded-lg transition-all duration-300 ${focused === "name" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focused === "name" ? "text-primary" : "text-muted-foreground"}`} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors" />
                </div>
              </motion.div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-mail</label>
              <div className={`relative rounded-lg transition-all duration-300 ${focused === "email" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  placeholder="seu@email.com" required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Senha</label>
              <div className={`relative rounded-lg transition-all duration-300 ${focused === "password" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focused === "password" ? "text-primary" : "text-muted-foreground"}`} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 relative overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.25) 55%, transparent 60%)",
                }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </span>
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <p className="text-center text-xs text-muted-foreground mt-6">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "Criar conta" : "Entrar"}
              </button>
            </p>

            <Link to="/" className="block text-center text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors">
              ← Voltar para a página inicial
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
