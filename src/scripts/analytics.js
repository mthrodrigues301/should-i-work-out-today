import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

const CONSENT_KEY = "workout-consent-v1";
let analyticsInjected = false;
let speedInsightsInjected = false;

function hasAnalyticsConsent() {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY))?.analytics === true;
  } catch {
    return false;
  }
}

function enableAnalytics() {
  if (analyticsInjected || !hasAnalyticsConsent()) return;
  analyticsInjected = true;
  inject({
    beforeSend(event) {
      return hasAnalyticsConsent() ? event : null;
    }
  });
}

function enableSpeedInsights() {
  if (speedInsightsInjected || !hasAnalyticsConsent()) return;
  speedInsightsInjected = true;
  injectSpeedInsights({
    beforeSend(event) {
      return hasAnalyticsConsent() ? event : null;
    }
  });
}

enableAnalytics();
enableSpeedInsights();

window.addEventListener("workout:consent", (event) => {
  if (event.detail?.analytics) {
    enableAnalytics();
    enableSpeedInsights();
  }
});
