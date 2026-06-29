// Resolve booking credentials from env (preferred) or site.config.
import { site } from "../data/site.config";

export function isBookingConfigured(value: string) {
  return !!value && !value.startsWith("TODO");
}

export function getCalcomUser() {
  const fromEnv = import.meta.env.VITE_CALCOM_USER?.trim();
  return fromEnv || site.booking.calcomUser;
}

export function getWeb3formsKey() {
  const fromEnv = import.meta.env.VITE_WEB3FORMS_KEY?.trim();
  return fromEnv || site.booking.web3formsKey;
}

/** Cal.com embed path — `username` or `username/event-slug`. */
export function buildCalLink(eventSlug?: string) {
  const user = getCalcomUser();
  if (!isBookingConfigured(user)) return null;
  if (eventSlug && isBookingConfigured(eventSlug)) return `${user}/${eventSlug}`;
  return user;
}

export const calcomReady = isBookingConfigured(getCalcomUser());
export const web3formsReady = isBookingConfigured(getWeb3formsKey());
