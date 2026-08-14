import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LandingPage } from "./features/onboarding/LandingPage";
import { OffersPage } from "./features/onboarding/OffersPage";
import { CheckoutPage } from "./features/onboarding/CheckoutPage";
import { ActivationPage } from "./features/onboarding/ActivationPage";
import { OnboardingWizard } from "./features/onboarding/OnboardingWizard";
import { SalesDashboard } from "./features/dashboard/SalesDashboard";
import { ProductManager } from "./features/products/ProductManager";
import { OrderManager } from "./features/orders/OrderManager";
import { SalesInbox } from "./features/inbox/SalesInbox";
import { MarketingHub } from "./features/marketing/MarketingHub";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { PublicShopPage } from "./features/shop/PublicShopPage";
import { PaymentCallback } from "./features/dashboard/PaymentCallback";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuthStore } from "./stores/authStore";
import { useOnboardingStore } from "./stores/onboardingStore";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { WifiOff } from "./components/ui/WifiOff";
import { subscribeToPush } from "./lib/pushUtils";
import { Sparkles } from "lucide-react";

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
      <div className="min-h-screen bg-vendeur-coal flex items-center justify-center">
        <Sparkles className="animate-spin text-vendeur-emerald" size={48} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <WifiOff />
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/onboarding" element={
              user ? (
                !!user.onboardingCompleted ? <Navigate to="/dashboard" /> : <OnboardingWizard />
              ) : (
                <Navigate to="/" />
              )
            } />

            <Route path="/offers" element={<OffersPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/activation" element={<ActivationPage />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />

            <Route element={
              user ? (
                !!user.onboardingCompleted ? <AppLayout /> : <Navigate to="/onboarding" />
              ) : (
                <Navigate to="/" />
              )
            }>
              <Route path="/dashboard" element={<SalesDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/products" element={<ProductManager />} />
              <Route path="/orders" element={<OrderManager />} />
              <Route path="/inbox" element={<SalesInbox />} />
              <Route path="/marketing" element={<MarketingHub />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/shop/:merchantId" element={<PublicShopPage />} />
          </Routes>
          <Toaster theme="dark" position="top-center" />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
