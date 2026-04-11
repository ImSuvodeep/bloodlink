// src/api/client.js — Centralized API client with automatic JWT attachment

const BASE = import.meta.env.VITE_API_URL || '';  // Empty = same origin (via Vite proxy in dev, or Express in prod)
const TOKEN_KEY = 'bloodlink_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authedFetch(method, path, body = undefined) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const message = data?.error || data?.errors?.[0]?.msg || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get:   (path)        => authedFetch('GET',   path),
  post:  (path, body)  => authedFetch('POST',  path, body),
  patch: (path, body)  => authedFetch('PATCH', path, body),
  del:   (path)        => authedFetch('DELETE', path),
};
