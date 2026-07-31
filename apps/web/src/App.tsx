import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { LandingPage } from "./features/onboarding/LandingPage";
import { OnboardingWizard } from "./features/onboarding/OnboardingWizard";
import { SalesDashboard } from "./features/dashboard/SalesDashboard";
import { ProductManager } from "./features/products/ProductManager";
import { SalesInbox } from "./features/inbox/SalesInbox";
import { KnowledgeSetup } from "./features/settings/KnowledgeSetup";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuthStore } from "./stores/authStore";
import { useOnboardingStore } from "./stores/onboardingStore";

function App() {
  const { user } = useAuthStore();
  const { tempData } = useOnboardingStore();

  return (
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
          <Route path="/products" element={<ProductManager />} />
          <Route path="/inbox" element={<SalesInbox />} />
          <Route path="/knowledge" element={<KnowledgeSetup />} />
          <Route path="/settings" element={<div>Paramètres</div>} />
        </Route>
      </Routes>
      <Toaster theme="dark" position="top-center" />
    </BrowserRouter>
  );
}

export default App;
