import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me')
};

export const domains = {
  getAll: () => api.get('/domains'),
  getOne: (id) => api.get(`/domains/${id}`),
  getWithProgress: (id) => api.get(`/domains/${id}/with-progress`),
  create: (data) => api.post('/domains', data),
  update: (id, data) => api.put(`/domains/${id}`, data),
  delete: (id) => api.delete(`/domains/${id}`)
};

export const evaluation = {
  getDomains: () => api.get('/evaluation/domains'),
  getChamps: (domainId) => api.get(`/evaluation/champs/${domainId}`),
  getRefs: (champId) => api.get(`/evaluation/refs/${champId}`),
  getQuestions: (refId) => api.get(`/evaluation/questions/${refId}`),
  getQuestion: (questionId) => api.get(`/evaluation/question/${questionId}`)
};

export const answers = {
  submit: (data) => api.post('/answers', data),
  update: (id, data) => api.put(`/answers/${id}`, data),
  getMyAnswers: () => api.get('/answers/my-answers'),
  getOne: (id) => api.get(`/answers/${id}`)
};

export const uploads = {
  upload: (formData) => api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/uploads/${id}`)
};

export const admin = {
  getPending: () => api.get('/admin/pending'),
  getAnswer: (id) => api.get(`/admin/answers/${id}`),
  review: (id, data) => api.put(`/admin/answers/${id}/review`, data),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllAnswers: (params) => api.get('/admin/all-answers', { params }),
  getChamps: (domainId) => api.get('/admin/structures/champs', { params: { domain_id: domainId } }),
  createChamp: (data) => api.post('/admin/structures/champs', data),
  updateChamp: (id, data) => api.put(`/admin/structures/champs/${id}`, data),
  deleteChamp: (id) => api.delete(`/admin/structures/champs/${id}`),
  getRefs: (champId) => api.get('/admin/structures/refs', { params: { champ_id: champId } }),
  createRef: (data) => api.post('/admin/structures/refs', data),
  updateRef: (id, data) => api.put(`/admin/structures/refs/${id}`, data),
  deleteRef: (id) => api.delete(`/admin/structures/refs/${id}`),
  getQuestions: (refId) => api.get('/admin/structures/questions', { params: { ref_id: refId } }),
  createQuestion: (data) => api.post('/admin/structures/questions', data),
  updateQuestion: (id, data) => api.put(`/admin/structures/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/structures/questions/${id}`),
  getNextDomainNumber: () => api.get('/admin/structures/next-domain-number'),
  getNextChampCode: (domainId) => api.get(`/admin/structures/next-champ-code/${domainId}`),
  getNextRefCode: (champId) => api.get(`/admin/structures/next-ref-code/${champId}`),
  getNextQuestionCode: (refId) => api.get(`/admin/structures/next-question-code/${refId}`)
};

export const notifications = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const stats = {
  getDomainStats: (id, year) => api.get(`/stats/domain/${id}/${year}`),
  getOverview: (year) => api.get(`/stats/overview/${year}`)
};

export default api;
