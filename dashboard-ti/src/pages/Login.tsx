import { useState } from "react";
import { Eye, EyeOff, BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      toast.error("Falha na autenticação. Verifique suas credenciais.");
      setIsLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("equipe_ti")
      .select("cargo, nome")
      .eq("id", authData.user.id)
      .maybeSingle();

    localStorage.setItem("userRole", roleData?.cargo || "tecnico");
    localStorage.setItem("userName", roleData?.nome || "");

    toast.success("Acesso autorizado. Redirecionando...");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left — Branding */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-primary lg:flex">
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Network lines grafismo */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <line x1="10%" y1="15%" x2="45%" y2="35%" stroke="white" strokeWidth="1" />
          <line x1="45%" y1="35%" x2="80%" y2="20%" stroke="white" strokeWidth="1" />
          <line x1="80%" y1="20%" x2="90%" y2="55%" stroke="white" strokeWidth="1" />
          <line x1="90%" y1="55%" x2="60%" y2="70%" stroke="white" strokeWidth="1" />
          <line x1="60%" y1="70%" x2="25%" y2="60%" stroke="white" strokeWidth="1" />
          <line x1="25%" y1="60%" x2="10%" y2="85%" stroke="white" strokeWidth="1" />
          <line x1="45%" y1="35%" x2="25%" y2="60%" stroke="white" strokeWidth="1" />
          <line x1="80%" y1="20%" x2="60%" y2="70%" stroke="white" strokeWidth="1" />
          <line x1="45%" y1="35%" x2="60%" y2="70%" stroke="white" strokeWidth="1" />
          <line x1="15%" y1="40%" x2="45%" y2="35%" stroke="white" strokeWidth="1" />
          <line x1="70%" y1="85%" x2="90%" y2="55%" stroke="white" strokeWidth="1" />
          <line x1="25%" y1="60%" x2="60%" y2="70%" stroke="white" strokeWidth="1" />
          <circle cx="10%" cy="15%" r="2" fill="white" />
          <circle cx="45%" cy="35%" r="3" fill="white" />
          <circle cx="80%" cy="20%" r="2" fill="white" />
          <circle cx="90%" cy="55%" r="2.5" fill="white" />
          <circle cx="60%" cy="70%" r="3" fill="white" />
          <circle cx="25%" cy="60%" r="2" fill="white" />
          <circle cx="10%" cy="85%" r="2" fill="white" />
          <circle cx="15%" cy="40%" r="1.5" fill="white" />
          <circle cx="70%" cy="85%" r="2" fill="white" />
        </svg>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col items-center gap-10 px-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <BrainCircuit size={32} strokeWidth={1.5} className="text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              Plataforma de Help Desk
            </span>
            <h2 className="font-sans text-2xl font-semibold leading-snug">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Sua TI Potencializada
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                por{" "}
              </span>
              <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent font-bold">
                IA.
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex w-full items-center justify-center bg-surface px-6 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <BrainCircuit size={18} strokeWidth={1.5} className="text-primary-foreground" />
            </div>
          </div>

          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground">
            Acesso ao Help Desk
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Insira suas credenciais para acessar o painel.
          </p>

          <form onSubmit={handleLogin} className="mt-10 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="seu@email.com"
                required
                className="h-12 w-full rounded-xl border border-input bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus:bg-surface focus:ring-2 focus:ring-foreground focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  required
                  className="h-12 w-full rounded-xl border border-input bg-muted px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus:bg-surface focus:ring-2 focus:ring-foreground focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="h-12 w-full rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
