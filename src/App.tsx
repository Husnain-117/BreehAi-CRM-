import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import { useState } from 'react';
import AdminLogin from './pages/AdminLogin';
import AdminPanelPage from './pages/AdminPanelPage';

const queryClient = new QueryClient();

const App = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex justify-end p-4">
            <Link
              to="/admin-login"
              className="bg-black text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Admin
            </Link>
          </div>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanelPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
