const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = (
  configuredApiUrl ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000')
).replace(/\/+$/, '');

export default API_URL;