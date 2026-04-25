import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <div className="h-screen w-full overflow-hidden bg-background">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <AppHeader collapsed={collapsed} />
        <main
          className="flex flex-col h-[calc(100vh-var(--header-height))] p-8 transition-all duration-300"
          style={{
            marginLeft: collapsed ? 72 : "var(--sidebar-width)",
            marginTop: "var(--header-height)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
