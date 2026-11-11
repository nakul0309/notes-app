import { request } from './client';

export const registerUser = (payload) => request('/auth/register', { method: 'POST', body: payload });
export const loginUser = (payload) => request('/auth/login', { method: 'POST', body: payload });
export const fetchCurrentUser = () => request('/auth/me');
