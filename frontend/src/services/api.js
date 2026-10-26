import axios from 'axios';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('research_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling 401s gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('research_token');
      localStorage.removeItem('research_user');
      // Optional redirect if needed
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => apiClient.post('/auth/reset-password', { token, new_password }),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getStats: () => apiClient.get('/users/stats'),
};

export const projectsAPI = {
  list: () => apiClient.get('/projects'),
  create: (data) => apiClient.post('/projects', data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
};

export const papersAPI = {
  list: (params) => apiClient.get('/papers', { params }),
  get: (id) => apiClient.get(`/papers/${id}`),
  upload: (formData) => apiClient.post('/papers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  importAcademic: (data) => apiClient.post('/papers/import-academic', data),
  toggleFavorite: (id) => apiClient.put(`/papers/${id}/favorite`),
  delete: (id) => apiClient.delete(`/papers/${id}`),
  getFullText: (id) => apiClient.get(`/papers/${id}/fulltext`),
  getAnalysis: (id) => apiClient.get(`/papers/${id}/analysis`),
  regenerateAnalysis: (id) => apiClient.post(`/papers/${id}/analysis/regenerate`),
};

export const chatAPI = {
  listConversations: (params) => apiClient.get('/chat/conversations', { params }),
  getConversation: (id) => apiClient.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => apiClient.delete(`/chat/conversations/${id}`),
  sendMessage: (data) => apiClient.post('/chat/message', data),
};

export const searchAPI = {
  search: (params) => apiClient.get('/search', { params }),
};

export const comparisonAPI = {
  compare: (paper_ids) => apiClient.post('/comparison', { paper_ids }),
};

export const researchGapsAPI = {
  detect: (params) => apiClient.get('/research-gaps', { params }),
};

export const roadmapsAPI = {
  list: () => apiClient.get('/roadmaps'),
  generate: (data) => apiClient.post('/roadmaps', data),
  get: (id) => apiClient.get(`/roadmaps/${id}`),
  delete: (id) => apiClient.delete(`/roadmaps/${id}`),
};

export const notesAPI = {
  list: (params) => apiClient.get('/notes', { params }),
  create: (data) => apiClient.post('/notes', data),
  delete: (id) => apiClient.delete(`/notes/${id}`),
};

export const exportsAPI = {
  list: () => apiClient.get('/exports'),
  create: (data) => apiClient.post('/exports', data),
};

export const jobsAPI = {
  getStatus: (jobId) => apiClient.get(`/jobs/${jobId}`),
};

export default apiClient;
