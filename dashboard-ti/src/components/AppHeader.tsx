import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const mockNotifications = [
  {
    id: "1",
    text: "🚨 Novo chamado Urgente classificado pela IA: Queda de link principal",
    time: "há 2 min",
    read: false,
  },
  {
    id: "2",
    text: "Chamado #TK-1038 está próximo de estourar o SLA",
    time: "há 15 min",
    read: false,
  },
];

interface AppHeaderProps {
  collapsed: boolean;
}

export function AppHeader({ collapsed }: AppHeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(mockNotifications);
  const hasUnread = notifications.some((n) => !n.read);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCargo, setUserCargo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("equipe_ti")
        .select("nome, email, cargo")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profile) {
        setUserName(profile.nome);
        setUserEmail(profile.email);
        setUserCargo(profile.cargo);
      } else {
        setUserEmail(authData.user.email ?? "");
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    toast.success("Sessão encerrada com sucesso");
    navigate("/login");
  };

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : userEmail ? userEmail[0].toUpperCase() : "?";

  const isAdmin = userCargo.toLowerCase() === "administrador";

  return (
    <header
      className="fixed right-0 top-0 z-20 flex h-header items-center justify-end gap-3 border-b border-border bg-header-bg px-6 transition-all duration-300"
      style={{ left: collapsed ? 72 : "var(--sidebar-width)" }}
    >
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {theme === "dark" ? (
          <Sun size={18} strokeWidth={1.5} />
        ) : (
          <Moon size={18} strokeWidth={1.5} />
        )}
      </button>

      {/* Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Bell size={18} strokeWidth={1.5} />
            {hasUnread && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-priority-high opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-priority-high" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-medium text-foreground">Notificações</span>
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Marcar como lidas
            </button>
          </div>
          <div className="flex flex-col">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm text-foreground leading-snug">{n.text}</p>
                <span className="text-[11px] text-muted-foreground">{n.time}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* User avatar + profile dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-accent"
        >
          <span className="font-mono text-xs font-medium">{initials}</span>
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-border bg-popover p-5 shadow-xl">
            <div className="flex flex-col gap-1">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40 mt-1" />
                  <Skeleton className="h-5 w-20 mt-2 rounded-full" />
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-popover-foreground">{userName || "Usuário"}</span>
                  <span className="text-xs text-muted-foreground">{userEmail || "—"}</span>
                  {userCargo && (
                    <Badge
                      className={`mt-2 w-fit text-[10px] uppercase tracking-wider ${
                        isAdmin
                          ? "border-transparent bg-foreground text-background hover:bg-foreground/90"
                          : "border-transparent bg-muted text-muted-foreground hover:bg-muted/90"
                      }`}
                    >
                      {userCargo}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="my-4 border-t border-border" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-popover-foreground cursor-pointer"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Sair do Sistema
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
