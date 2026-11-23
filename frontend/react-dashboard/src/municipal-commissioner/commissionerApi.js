import { baseApi } from '../services/baseApi.js';

export const commissionerApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCommissionerUsers: build.query({
      query: () => '/users',
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    getCommissionerProfile: build.query({
      query: () => '/users/me',
      providesTags: [{ type: 'User', id: 'ME' }],
    }),
    getCommissionerDepartmentOfficer: build.query({
      query: () => '/users/department-officer',
      providesTags: [{ type: 'User', id: 'DEPARTMENT_OFFICER' }],
    }),
    getCommissionerApplications: build.query({
      query: () => '/applications/submitted',
      providesTags: [{ type: 'Application', id: 'LIST' }],
    }),
    getCommissionerOfficers: build.query({
      query: () => '/officers',
      providesTags: [
        { type: 'User', id: 'OFFICERS' },
        { type: 'Assignment', id: 'OFFICERS' },
      ],
    }),
    getCommissionerLicenses: build.query({
      query: () => '/licenses',
      providesTags: [{ type: 'License', id: 'LIST' }],
    }),
    getCommissionerAuditLogs: build.query({
      query: () => '/audit-logs',
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),
    assignCommissionerApplication: build.mutation({
      query: ({ applicationId, officerId }) => ({
        url: `/applications/${applicationId}/assign`,
        method: 'PATCH',
        body: { officerId: Number(officerId) },
      }),
      invalidatesTags: (_result, error) => error ? [] : [
        { type: 'Application', id: 'LIST' },
        { type: 'User', id: 'LIST' },
      ],
    }),
    createCommissionerUser: build.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: (_result, error) => error ? [] : [
        { type: 'User', id: 'LIST' },
      ],
    }),
    updateCommissionerUser: build.mutation({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, error) => error ? [] : [
        { type: 'User', id: 'LIST' },
      ],
    }),
    deleteCommissionerUser: build.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, error) => error ? [] : [
        { type: 'User', id: 'LIST' },
      ],
    }),
    saveCommissionerDepartmentOfficer: build.mutation({
      query: ({ body, replace }) => ({
        url: `/users/department-officer${replace ? '/replace' : ''}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, error) => error ? [] : [
        { type: 'User', id: 'LIST' },
        { type: 'User', id: 'DEPARTMENT_OFFICER' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCommissionerUsersQuery,
  useLazyGetCommissionerUsersQuery,
  useGetCommissionerProfileQuery,
  useLazyGetCommissionerProfileQuery,
  useLazyGetCommissionerDepartmentOfficerQuery,
  useGetCommissionerApplicationsQuery,
  useLazyGetCommissionerApplicationsQuery,
  useLazyGetCommissionerOfficersQuery,
  useGetCommissionerLicensesQuery,
  useGetCommissionerAuditLogsQuery,
  useAssignCommissionerApplicationMutation,
  useCreateCommissionerUserMutation,
  useUpdateCommissionerUserMutation,
  useDeleteCommissionerUserMutation,
  useSaveCommissionerDepartmentOfficerMutation,
} = commissionerApi;
