/// <reference types="vite/client" />

const getApiBaseUrl = async (): Promise<string> => {
  const defaultUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
  
  // Try the default URL first
  try {
    const response = await fetch(`${defaultUrl.replace('/api', '')}/health`, { method: 'GET' });
    if (response.ok) {
      return defaultUrl;
    }
  } catch (error) {
    console.log('Default API URL not available, trying alternatives...');
  }

  // Try ports starting from 4000 upwards
  for (let port = 4000; port <= 4010; port++) {
    try {
      const testUrl = `http://localhost:${port}/api`;
      const response = await fetch(`${testUrl.replace('/api', '')}/health`, { method: 'GET' });
      if (response.ok) {
        console.log(`Found API server on port ${port}`);
        return testUrl;
      }
    } catch (error) {
      // Continue to next port
    }
  }

  // Fallback to default
  console.warn('Could not find API server, using default URL');
  return defaultUrl;
};

let BASE_URL: string;

const initializeBaseUrl = async () => {
  if (!BASE_URL) {
    BASE_URL = await getApiBaseUrl();
  }
  return BASE_URL;
};

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

const parseResponse = async (res: Response): Promise<any> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API request failed with status ${res.status}: ${text}`);
  }
  return res.json();
};

const fetchJson = async (endpoint: string, options?: RequestInit): Promise<any> => {
  const baseUrl = await initializeBaseUrl();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: getHeaders(),
    ...options,
  });
  return parseResponse(res);
};

export const api = {
  get: async (endpoint: string): Promise<any> => {
    return fetchJson(endpoint);
  },

  post: async (endpoint: string, body: any): Promise<any> => {
    return fetchJson(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put: async (endpoint: string, body: any): Promise<any> => {
    return fetchJson(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete: async (endpoint: string): Promise<any> => {
    return fetchJson(endpoint, {
      method: "DELETE",
    });
  },
};
