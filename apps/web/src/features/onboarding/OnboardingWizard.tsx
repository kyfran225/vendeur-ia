import React from "react";
import { useNavigate } from "react-router-dom";

export function OnboardingWizard() {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate("/offers", { replace: true });
  }, [navigate]);

  return null;
}
