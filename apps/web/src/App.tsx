import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LandingPage } from "./features/onboarding/LandingPage";
import { OnboardingWizard } from "./features/onboarding/OnboardingWizard";
import { SalesDashboard } from "./features/dashboard/SalesDashboard";
import { ProductManager } from "./features/products/ProductManager";
import { SalesInbox } from "./features/inbox/SalesInbox";
import { MarketingHub } from "./features/marketing/MarketingHub";
import { KnowledgeSetup } from "./features/settings/KnowledgeSetup";
import { AiSettings } from "./features/settings/AiSettings";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuthStore } from "./stores/authStore";
import { useOnboardingStore } from "./stores/onboardingStore";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { subscribeToPush } from "./lib/pushUtils";

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const { user, accessToken } = useAuthStore();
  const { tempData } = useOnboardingStore();

  React.useEffect(() => {
    if (accessToken) {
      subscribeToPush(accessToken);
    }
  }, [accessToken]);

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              user
                ? <Navigate to={tempData ? "/onboarding" : "/dashboard"} />
                : <LandingPage />
            } />

            <Route path="/onboarding" element={
              user ? <OnboardingWizard /> : <Navigate to="/" />
            } />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<SalesDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/products" element={<ProductManager />} />
              <Route path="/inbox" element={<SalesInbox />} />
              <Route path="/marketing" element={<MarketingHub />} />
              <Route path="/knowledge" element={<KnowledgeSetup />} />
              <Route path="/settings" element={<AiSettings />} />
            </Route>
          </Routes>
          <Toaster theme="dark" position="top-center" />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
