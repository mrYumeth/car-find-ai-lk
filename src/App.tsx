
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostVehicle from "./pages/PostVehicle";
import VehicleDetail from "./pages/VehicleDetail";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import AIRecommendations from "./pages/AIRecommendations";
import AdminDashboard from "./pages/AdminDashboard";
import ReportListing from "./pages/ReportListing";
import NotFound from "./pages/NotFound";
import EditVehicle from "./pages/EditVehicle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post-vehicle" element={<PostVehicle />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/recommendations" element={<AIRecommendations />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/report/:id" element={<ReportListing />} />
          <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
