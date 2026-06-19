const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token 
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `请求失败: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : '请求失败' };
  }
}

// 认证 API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; username: string; role?: string }) =>
    request<{ access_token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request<any>('/api/auth/profile'),
};

// 用户 API
export const usersApi = {
  getAll: () => request<any[]>('/api/users'),
  getById: (id: string) => request<any>(`/api/users/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/api/users/${id}`, {
      method: 'DELETE',
    }),
};

// 会话 API
export const sessionsApi = {
  getAll: (mine?: boolean) =>
    request<any[]>(`/api/sessions${mine ? '?mine=true' : ''}`),
  
  getById: (id: string) => request<any>(`/api/sessions/${id}`),
  
  create: (data: { title: string; description?: string; language: string; initialCode?: string }) =>
    request<any>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    request<any>(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<void>(`/api/sessions/${id}`, {
      method: 'DELETE',
    }),
  
  start: (id: string) =>
    request<any>(`/api/sessions/${id}/start`, {
      method: 'POST',
    }),
  
  end: (id: string) =>
    request<any>(`/api/sessions/${id}/end`, {
      method: 'POST',
    }),
  
  join: (id: string) =>
    request<any>(`/api/sessions/${id}/join`, {
      method: 'POST',
    }),
  
  leave: (id: string) =>
    request<any>(`/api/sessions/${id}/leave`, {
      method: 'POST',
    }),
};

// 录制 API
export const recordingsApi = {
  getAll: (mine?: boolean) =>
    request<any[]>(`/api/recordings${mine ? '?mine=true' : ''}`),
  
  getBySession: (sessionId: string) =>
    request<any[]>(`/api/recordings/session/${sessionId}`),
  
  getById: (id: string) => request<any>(`/api/recordings/${id}`),
  
  getPlaybackData: (id: string) =>
    request<any>(`/api/recordings/${id}/playback`),
  
  getSnapshot: (id: string, timestamp: number) =>
    request<{ code: string }>(`/api/recordings/${id}/snapshot?timestamp=${timestamp}`),
  
  create: (data: { sessionId: string; title: string; language: string; initialCode?: string }) =>
    request<any>('/api/recordings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  addOperation: (id: string, operation: any) =>
    request<void>(`/api/recordings/${id}/operations`, {
      method: 'POST',
      body: JSON.stringify(operation),
    }),
  
  addOperationsBatch: (id: string, operations: any[]) =>
    request<void>(`/api/recordings/${id}/operations/batch`, {
      method: 'POST',
      body: JSON.stringify(operations),
    }),
  
  complete: (id: string, finalCode: string) =>
    request<any>(`/api/recordings/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ finalCode }),
    }),
  
  delete: (id: string) =>
    request<void>(`/api/recordings/${id}`, {
      method: 'DELETE',
    }),
};

// 分析 API
export const analyticsApi = {
  getByRecording: (recordingId: string) =>
    request<any>(`/api/analytics/recording/${recordingId}`),
  
  getBySession: (sessionId: string) =>
    request<any[]>(`/api/analytics/session/${sessionId}`),
  
  getByUser: () => request<any[]>('/api/analytics/user'),
  
  create: (data: { recordingId: string; sessionId: string }) =>
    request<any>('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  addInputEvent: (recordingId: string, event: any) =>
    request<void>(`/api/analytics/${recordingId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  
  addInputEventsBatch: (recordingId: string, events: any[]) =>
    request<void>(`/api/analytics/${recordingId}/events/batch`, {
      method: 'POST',
      body: JSON.stringify(events),
    }),
  
  process: (recordingId: string) =>
    request<any>(`/api/analytics/${recordingId}/process`, {
      method: 'POST',
    }),
  
  getHeatmap: (recordingId: string) =>
    request<any>(`/api/analytics/${recordingId}/heatmap`),
  
  getFrequencyCurve: (recordingId: string) =>
    request<any>(`/api/analytics/${recordingId}/frequency-curve`),
};
