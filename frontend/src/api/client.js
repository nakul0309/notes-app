const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'notes_token';
const SESSION_ERROR_CODES = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'NO_TOKEN'];

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, { status = 0, code, fieldErrors = {} } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

let sessionExpiredHandler = () => {};
export const onSessionExpired = (handler) => {
  sessionExpiredHandler = handler;
};

const toFieldErrors = (errors = []) =>
  errors.reduce((acc, { field, message }) => ({ ...acc, [field]: message }), {});

export async function request(path, { method = 'GET', body } = {}) {
  const token = tokenStorage.get();
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && SESSION_ERROR_CODES.includes(data.code)) {
      sessionExpiredHandler(data.code);
    }
    throw new ApiError(data.message || 'Something went wrong', {
      status: response.status,
      code: data.code,
      fieldErrors: toFieldErrors(data.errors),
    });
  }
  return data;
}
