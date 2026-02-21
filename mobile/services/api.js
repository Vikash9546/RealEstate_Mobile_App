import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Properties ──────────────────────────────────────────
export const propertyAPI = {
    getAll: (params) => api.get('/properties', { params }),
    getById: (id) => api.get(`/properties/${id}`),
    getMyListings: () => api.get('/properties/agent/my'),
    create: (data) => api.post('/properties', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/properties/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/properties/${id}`),
};

// ─── Favorites ───────────────────────────────────────────
export const favoritesAPI = {
    getAll: () => api.get('/favorites'),
    add: (propertyId) => api.post(`/favorites/${propertyId}`),
    remove: (propertyId) => api.delete(`/favorites/${propertyId}`),
    check: (propertyId) => api.get(`/favorites/check/${propertyId}`),
};

// ─── Chat ────────────────────────────────────────────────
export const chatAPI = {
    getRooms: () => api.get('/chats/rooms'),
    createOrGetRoom: (data) => api.post('/chats/rooms', data),
    getMessages: (roomId, params) => api.get(`/chats/rooms/${roomId}/messages`, { params }),
    sendMessage: (roomId, data) => api.post(`/chats/rooms/${roomId}/messages`, data),
};

export default api;
