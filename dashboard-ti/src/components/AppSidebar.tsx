import { LayoutDashboard, BookOpen, BarChart3, MessageSquare, Users, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Base de Conhecimento", url: "/conhecimento", icon: BookOpen },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Usuários Chatbot", url: "/chatbot", icon: MessageSquare },
  { title: "Equipe TI", url: "/equipe", icon: Users },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-surface transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-sidebar"
      }`}
    >
      {/* Logo */}
      <div className="flex h-header items-center px-6">
        <span className="font-mono text-sm font-medium tracking-tight text-foreground whitespace-nowrap">
          {collapsed ? "T" : "Trama"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            const linkContent = (
              <NavLink
                to={item.url}
                className={`group relative flex items-center gap-4 rounded-md px-3 py-2.5 text-sm transition-none ${
                  collapsed ? "justify-center px-0" : ""
                } ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground" />
                )}
                <item.icon size={20} strokeWidth={1.5} className="shrink-0" />
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">{item.title}</span>
                )}
              </NavLink>
            );

            return (
              <li key={item.title}>
                {collapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </li>
            );
          })}
        </ul>

        {/* Collapse toggle */}
        <div className="mt-4 border-t pt-4">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="flex w-full items-center justify-center rounded-md px-0 py-2.5 text-muted-foreground transition-none hover:text-foreground"
                >
                  <PanelLeftOpen size={20} strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Expandir Menu
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={onToggle}
              className="flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-none hover:text-foreground"
            >
              <PanelLeftClose size={20} strokeWidth={1.5} className="shrink-0" />
              <span className="font-medium whitespace-nowrap">Recolher Menu</span>
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}