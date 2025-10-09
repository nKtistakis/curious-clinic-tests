import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateTest from "./pages/CreateTest";
import TakeTest from "./pages/TakeTest";
import ReviewTest from "./pages/ReviewTest";
import Profile from "./pages/Profile";
import Patients from "./pages/Patients";
import Conditions from "./pages/Conditions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-test"
              element={
                <ProtectedRoute>
                  <CreateTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-test/:testId"
              element={
                <ProtectedRoute>
                  <CreateTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/take-test/:testId"
              element={
                <ProtectedRoute>
                  <TakeTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conditions"
              element={
                <ProtectedRoute>
                  <Conditions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review-test/:testAssignmentId"
              element={
                <ProtectedRoute>
                  <ReviewTest />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
