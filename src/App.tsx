import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import InstallPrompt from "@/components/InstallPrompt";
import PageTransition from "@/components/PageTransition";
import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";

// Eager-loaded (critical path)
import AuthPage from "./pages/AuthPage";

// Lazy-loaded pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RsvpPage = lazy(() => import("./pages/RsvpPage"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const MyBookingsPage = lazy(() => import("./pages/MyBookingsPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const VendorProfile = lazy(() => import("./pages/VendorProfile"));
const VendorAuth = lazy(() => import("./pages/VendorAuth"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const PlannerPage = lazy(() => import("./pages/PlannerPage"));
const BudgetPage = lazy(() => import("./pages/BudgetPage"));
const GuestsPage = lazy(() => import("./pages/GuestsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground animate-pulse">Harusi Smart</p>
    </div>
  </div>
);

/** Waits for auth initialization, then redirects unauthenticated users. */
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

/** Redirect authenticated users away from auth pages. */
const PublicOnlyGuard = ({ children }: { children: React.ReactNode }) => {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><CustomerDashboard /></PageTransition>} />
          <Route path="/my-bookings" element={<PageTransition><MyBookingsPage /></PageTransition>} />
          <Route path="/vendors" element={<PageTransition><VendorsPage /></PageTransition>} />
          <Route path="/vendor/:id" element={<PageTransition><VendorProfile /></PageTransition>} />
          <Route path="/vendor-dashboard" element={<PageTransition><VendorDashboard /></PageTransition>} />
          <Route path="/planner" element={<PageTransition><PlannerPage /></PageTransition>} />
          <Route path="/budget" element={<PageTransition><BudgetPage /></PageTransition>} />
          <Route path="/guests" element={<PageTransition><GuestsPage /></PageTransition>} />
          <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
          <Route path="/favorites" element={<PageTransition><FavoritesPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes — redirect to dashboard if already logged in */}
              <Route path="/auth" element={
                <PublicOnlyGuard><AuthPage /></PublicOnlyGuard>
              } />
              <Route path="/reset-password" element={
                <Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>
              } />
              <Route path="/vendor-auth" element={
                <Suspense fallback={<PageLoader />}><VendorAuth /></Suspense>
              } />
              <Route path="/rsvp/:token" element={
                <Suspense fallback={<PageLoader />}><RsvpPage /></Suspense>
              } />

              {/* Protected routes with navbar */}
              <Route path="/*" element={
                <AuthGuard>
                  <Navbar />
                  <AnimatedRoutes />
                  <InstallPrompt />
                </AuthGuard>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
