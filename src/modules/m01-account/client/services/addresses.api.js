import { getApiEndpoint } from '@/shared/api-endpoints.js';
import { api, resolveEndpointPath } from '@/shared/lib/http.js';

export const listAddresses = () => api.get(getApiEndpoint('API-M01-05').path);

export const createAddress = ({ body }) => api.post(getApiEndpoint('API-M01-08').path, body);

export const updateAddress = ({ id, body }) =>
  api.put(resolveEndpointPath(getApiEndpoint('API-M01-09').path, { id }), body);

export const deleteAddress = ({ id }) =>
  api.delete(resolveEndpointPath(getApiEndpoint('API-M01-10').path, { id }));

export const setDefaultAddress = ({ id }) =>
  api.post(resolveEndpointPath(getApiEndpoint('API-M01-11').path, { id }));