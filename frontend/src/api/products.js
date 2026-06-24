const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchProducts({ category, cursor, limit = 20 }) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (cursor) params.set('cursor', cursor);
  params.set('limit', limit);
  
  // Use relative URL if using Vite proxy, otherwise use absolute
  const isDev = import.meta.env.DEV;
  const url = isDev ? `/api/products?${params}` : `${BASE_URL}/api/products?${params}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchCategories() {
  const isDev = import.meta.env.DEV;
  const url = isDev ? `/api/categories` : `${BASE_URL}/api/categories`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
