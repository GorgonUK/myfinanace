export const appName = import.meta.env.VITE_APP_NAME;
export const appDomain = import.meta.env.VITE_APP_DOMAIN;
export const apiURL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/*$/, '');
export const mapsKey = import.meta.env.VITE_GMAPS_API_KEY;
