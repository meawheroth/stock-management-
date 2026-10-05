const API = '/api';

export async function request(path, options = {}) {
  const token = localStorage.getItem('toolroom-token');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'ไม่สามารถทำรายการได้');
  return data;
}

export const login = (email, password) => request('/auth/login', {
  method: 'POST', body: JSON.stringify({ email, password }),
});
