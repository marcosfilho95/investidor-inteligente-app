import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Eye, EyeOff, Mail, Lock, ArrowRight, User, TrendingUp, Shield, Bot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AnimatedBackground from "@/components/landing/FloatingElements";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsLogin(false);
    }
  }, [searchParams]);

  const getPasswordStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const strengthMeta = [
    { label: "Muito fraca", color: "bg-red-500" },
    { label: "Fraca", color: "bg-orange-500" },
    { label: "Media", color: "bg-yellow-500" },
    { label: "Boa", color: "bg-lime-500" },
    { label: "Forte", color: "bg-emerald-500" },
  ][strengthScore];

  const highlights = [
    { icon: TrendingUp, text: "25 ativos da B3 com dados reais" },
    { icon: Bot, text: "Hodl: IA que te ajuda a investir" },
    { icon: Shield, text: "Ambiente seguro para aprender" },
  ];

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmitSignup = !loading && !!name.trim() && !!email.trim() && password.length >= 6 && passwordsMatch;

  const handleBackToHome = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => navigate("/"), 320);
  };

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
        if (password !== confirmPassword) {
          toast({ title: "As senhas nao conferem", variant: "destructive" });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });

        if (error) throw error;

        toast({ title: "Conta criada com sucesso!", description: "Voce ja pode acessar a plataforma." });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-background relative flex overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none ${
        isLeaving ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
      }`}
    >
      <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatedBackground fixed={false} />
      </div>

      <div className="hidden lg:block absolute inset-y-0 left-0 w-[58%] overflow-hidden pointer-events-none z-0">
        <AnimatedBackground fixed={false} />
      </div>

      <div className="hidden lg:flex lg:w-[58%] flex-col items-center justify-center p-12 relative z-10 overflow-hidden border-r border-border/50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative z-10 text-center max-w-[660px]"
        >
          <div className="h-20 w-20 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-8">
            <LayoutDashboard className="h-10 w-10 text-primary" />
          </div>

          <h2 className="text-4xl font-bold mb-4">Investidor Inteligente</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Aprenda a investir com o apoio do <span className="text-primary font-semibold">Hodl</span>, seu assistente de IA.
          </p>

          <div className="mt-8 space-y-4 text-left">
            {highlights.map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.45 }}
                className="glass-card p-5 flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg text-muted-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: "Ativos", value: "25" },
              { label: "Indicadores", value: "20+" },
              { label: "Trilhas de estudo", value: "6" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.12, duration: 0.45 }}
                className="glass-card p-5 text-center"
              >
                <p className="text-4xl font-bold font-mono text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 lg:basis-[42%] flex items-center justify-center p-6 overflow-hidden relative z-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-[450px] relative z-10">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Investidor Inteligente</span>
          </div>

          <h1 className="text-xl font-bold mb-1">{isLogin ? "Que bom te ver por aqui!" : "Criar sua conta"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isLogin ? "Entre para acessar sua carteira" : "Comece sua jornada de investimentos"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence initial={false}>
                  {!isLogin && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
                      <div className={`relative rounded-lg transition-all duration-300 ${focused === "name" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "name" ? "text-primary" : "text-muted-foreground"}`} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocused("name")}
                        onBlur={() => setFocused(null)}
                        placeholder="Seu nome completo"
                        className="w-full pl-10 pr-4 py-3.5 rounded-lg bg-card border border-border/50 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-mail</label>
                  <div className={`relative rounded-lg transition-all duration-300 ${focused === "email" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-lg bg-card border border-border/50 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Senha</label>
                  <div className={`relative rounded-lg transition-all duration-300 ${focused === "password" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "password" ? "text-primary" : "text-muted-foreground"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-3.5 rounded-lg bg-card border border-border/50 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {!isLogin && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${strengthMeta.color} transition-all duration-300`} style={{ width: `${(strengthScore / 4) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Forca da senha: <span className="font-medium">{password ? strengthMeta.label : "-"}</span>
                      </p>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirmar senha</label>
                    <div className={`relative rounded-lg transition-all duration-300 ${focused === "confirmPassword" ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focused === "confirmPassword" ? "text-primary" : "text-muted-foreground"}`} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocused("confirmPassword")}
                        onBlur={() => setFocused(null)}
                        placeholder="Repita sua senha"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-10 py-3.5 rounded-lg bg-card border border-border/50 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`mt-1 text-[11px] ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                        {passwordsMatch ? "Senhas conferem" : "As senhas nao sao iguais"}
                      </p>
                    )}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLogin ? loading : !canSubmitSignup}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 relative overflow-hidden"
                >
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.25) 55%, transparent 60%)",
                    }}
                    animate={{ x: ["-120%", "120%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </span>
                </motion.button>
              </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {isLogin ? "Nao tem uma conta?" : "Ja tem uma conta?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>

          <Link to="/" onClick={handleBackToHome} className="block text-center text-sm text-muted-foreground mt-2 py-1 hover:text-foreground transition-colors">
            ← Voltar para a pagina inicial
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;



