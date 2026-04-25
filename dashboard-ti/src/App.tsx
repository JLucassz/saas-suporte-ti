import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Conhecimento from "./pages/Conhecimento";
import Relatorios from "./pages/Relatorios";
import Chatbot from "./pages/Chatbot";
import Equipe from "./pages/Equipe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/conhecimento" element={<Conhecimento />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/equipe" element={<Equipe />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
