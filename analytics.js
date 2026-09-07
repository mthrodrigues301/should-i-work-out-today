import { inject } from "@vercel/analytics";

const CONSENT_KEY = "workout-consent-v1";
let analyticsInjected = false;

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

enableAnalytics();

window.addEventListener("workout:consent", (event) => {
  if (event.detail?.analytics) enableAnalytics();
});
