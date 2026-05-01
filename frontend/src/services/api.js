const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro inesperado' }));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((item) => {
        if (item.loc?.includes('password') && item.type === 'string_too_short') {
          return 'Senha deve ter pelo menos 8 caracteres';
        }
        return item.msg;
      }).join(' ')
      : error.detail;
    throw new Error(detail || 'Erro inesperado');
  }

  if (response.status === 204) return null;
  return response.json();
}
