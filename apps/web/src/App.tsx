import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LandingPage } from "./features/onboarding/LandingPage";
import { OffersPage } from "./features/billing/OffersPage";
import { CheckoutPage } from "./features/billing/CheckoutPage";
import { ActivationPage } from "./features/onboarding/ActivationPage";
import { SalesDashboard } from "./features/dashboard/SalesDashboard";
import { ProductManager } from "./features/products/ProductManager";
import { OrderManager } from "./features/orders/OrderManager";
import { SalesInbox } from "./features/inbox/SalesInbox";
import { MarketingHub } from "./features/marketing/MarketingHub";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { PublicShopPage } from "./features/shop/PublicShopPage";
import { PaymentCallback } from "./features/dashboard/PaymentCallback";
import { PrivacyPolicyPage } from "./features/legal/PrivacyPolicyPage";
import { DataDeletionPage } from "./features/legal/DataDeletionPage";
import { TermsOfServicePage } from "./features/legal/TermsOfServicePage";
import { MagicLoginPage } from "./features/auth/MagicLoginPage";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuthStore } from "./stores/authStore";
import { useOnboardingStore } from "./stores/onboardingStore";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { WifiOff } from "./components/ui/WifiOff";
import { subscribeToPush } from "./lib/pushUtils";
import { Sparkles } from "lucide-react";

import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const { tempData } = useOnboardingStore();

  React.useEffect(() => {
    if (accessToken) {
      subscribeToPush(accessToken).catch(err => {
        console.warn("[Push] Optional subscription failed:", err.message);
      });
    }
  }, [accessToken]);

  if (!_hasHydrated) {
    return (
      <VendeurIALoader fullscreen size="xl" label="Initialisation de Vendeur IA..." />
    );
  }

  const content = (
    <BrowserRouter>
      <WifiOff />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/magic-login" element={<MagicLoginPage />} />

        <Route path="/onboarding" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />

        <Route path="/offers" element={<OffersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/activation" element={<ActivationPage />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />

        <Route element={
          user ? <AppLayout /> : <Navigate to="/" replace />
        }>
          <Route path="/dashboard" element={<SalesDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/products" element={<ProductManager />} />
          <Route path="/orders" element={<OrderManager />} />
          <Route path="/inbox" element={<SalesInbox />} />
          <Route path="/marketing" element={<MarketingHub />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        <Route path="/shop/:merchantId" element={<PublicShopPage />} />
      </Routes>
      <Toaster theme="dark" position="top-center" />
    </BrowserRouter>
  );

  return (
    <ErrorBoundary>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {content}
        </GoogleOAuthProvider>
      ) : content}
    </ErrorBoundary>
  );
}

export default App;
