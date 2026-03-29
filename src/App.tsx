import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import TabletPOS from "./pages/TabletPOS";
import MobilePOS from "./pages/MobilePOS";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminCRM from "./pages/admin/AdminCRM";
import AdminKDS from "./pages/admin/AdminKDS";
import AdminSales from "./pages/admin/AdminSales";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminFloorPlan from "./pages/admin/AdminFloorPlan";
import AdminQueue from "./pages/admin/AdminQueue";
import QueueKiosk from "./pages/QueueKiosk";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tablet" element={<TabletPOS />} />
              <Route path="/mobile" element={<MobilePOS />} />
              <Route path="/queue" element={<QueueKiosk />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route path="promotions" element={<AdminPromotions />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="floorplan" element={<AdminFloorPlan />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="crm" element={<AdminCRM />} />
                <Route path="queue" element={<AdminQueue />} />
                <Route path="kds" element={<AdminKDS />} />
                <Route path="sales" element={<AdminSales />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
