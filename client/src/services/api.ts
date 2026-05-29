const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiConfig {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
  const token = localStorage.getItem('compass_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: config.method || 'GET',
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

// Auth APIs
export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    apiRequest('/auth/signup', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: data }),

  getMe: () => apiRequest('/auth/me'),
};

// Criteria APIs
export const criteriaApi = {
  getAll: () => apiRequest('/criteria'),
  create: (data: any) => apiRequest('/criteria', { method: 'POST', body: data }),
  update: (id: number, data: any) => apiRequest(`/criteria/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiRequest(`/criteria/${id}`, { method: 'DELETE' }),
  bulkUpdate: (criteria: any[]) => apiRequest('/criteria/bulk', { method: 'PUT', body: { criteria } }),
};

// Partners APIs
export const partnersApi = {
  getAll: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest(`/partners${query}`);
  },
  get: (id: number) => apiRequest(`/partners/${id}`),
  create: (data: any) => apiRequest('/partners', { method: 'POST', body: data }),
  update: (id: number, data: any) => apiRequest(`/partners/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiRequest(`/partners/${id}`, { method: 'DELETE' }),
  incrementDates: (id: number) => apiRequest(`/partners/${id}/increment-dates`, { method: 'POST' }),
};

// Ratings APIs
export const ratingsApi = {
  create: (data: any) => apiRequest('/ratings', { method: 'POST', body: data }),
  getHistory: (partnerId: number) => apiRequest(`/ratings/partner/${partnerId}/history`),
  getLatest: (partnerId: number) => apiRequest(`/ratings/partner/${partnerId}/latest`),
};

// Journal APIs
export const journalApi = {
  getAll: (partnerId: number) => apiRequest(`/journal/partner/${partnerId}`),
  create: (partnerId: number, data: { content: string; mood?: string }) =>
    apiRequest(`/journal/partner/${partnerId}`, { method: 'POST', body: data }),
  update: (id: number, data: { content?: string; mood?: string }) =>
    apiRequest(`/journal/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiRequest(`/journal/${id}`, { method: 'DELETE' }),
};

// Onboarding APIs
export const onboardingApi = {
  getQuestions: () => apiRequest('/onboarding/questions'),
  saveResponse: (data: { question_number: number; answer: string }) =>
    apiRequest('/onboarding/responses', { method: 'POST', body: data }),
  getResponses: () => apiRequest('/onboarding/responses'),
  generateCriteria: () => apiRequest('/onboarding/generate-criteria', { method: 'POST' }),
  complete: () => apiRequest('/onboarding/complete', { method: 'POST' }),
};

export { ApiError };
