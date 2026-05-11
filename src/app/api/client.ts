/// <reference types="vite/client" />

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

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
  const res = await fetch(`${BASE_URL}${endpoint}`, {
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
