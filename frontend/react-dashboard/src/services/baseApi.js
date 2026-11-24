import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectAccessToken } from '../features/auth/authSelectors.js';

export const API_BASE = 'http://localhost:3000/api';

export const baseApi = createApi({
  reducerPath: 'tradezoApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = selectAccessToken(getState());
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      } else {
        headers.delete('Authorization');
      }

      return headers;
    },
  }),
  tagTypes: [
    'Application',
    'Assignment',
    'Inspection',
    'Review',
    'Document',
    'Payment',
    'License',
    'User',
    'Municipality',
    'Compliance',
    'AuditLog',
    'PlatformOverview',
    'PlatformRevenue',
    'PlatformSettings',
  ],
  endpoints: () => ({}),
});
