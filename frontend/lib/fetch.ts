import { API_BASE_URL } from './api';

export const customFetch = async (endPoint: string, config: RequestInit = {}, headerKey?: string) => {
  const url = `${API_BASE_URL}${endPoint.startsWith("/") ? endPoint : `/${endPoint}`}`;

  const headers = new Headers(config.headers || {});

  // Ensure Content-Type is set only if not already present AND we aren't passing FormData (like document upload)
  if (!(config.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json");
  }

  // Inject any external link keys if provided
  if (headerKey) {
    headers.append("x-ext-link-key", headerKey);
  }

  // Define endpoints that should NEVER send a saved Authorization token (like login)
  const isAuthEndpoint = endPoint.includes('login') || endPoint.includes('register') || endPoint.includes('otp');

  // Inject Authorization Token from localStorage automatically if existing
  if (typeof window !== "undefined" && !isAuthEndpoint) {
    const authToken = localStorage.getItem("auth_token");
    if (authToken && !headers.has("Authorization")) {
      headers.append("Authorization", `Token ${authToken}`);
    }
  }

  const modifiedConfig = { ...config, headers };

  try {
    const response = await fetch(url, modifiedConfig);

    if (response.status === 404 && response.headers.get('content-type')?.includes('text/html')) {
      throw new Error("Not Found");
    }
    // We intentionally let 401 fall through so that the invoking UI component can properly parse `data.message`!

    return response;
  } catch (error: any) {
    // Only log non-404 errors to avoid noise
    if (error.message !== "Not Found") {
      console.error("Fetch Error: ", error.message || error);
    }
    throw error;
  }
};
