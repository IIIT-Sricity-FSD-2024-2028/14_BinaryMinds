import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { platformAdminRequest } from '../../services/platformAdminApi.js';
import { resetOnAuthChange } from '../../services/asyncThunkUtils.js';

const initialState = {
  corporationSummariesByMunicipalityId: {},
  settings: null,
  revenue: null,
  requests: {},
  errors: {},
};

function requirePlatformAdmin(thunkApi) {
  if (thunkApi.getState()?.auth?.user?.role !== 'platform_admin') {
    return thunkApi.rejectWithValue({ status: 403, message: 'Only Platform Admin can access these settings.' });
  }
  return null;
}

export const fetchPlatformAdminCorporationSummaries = createAsyncThunk(
  'platformAdminReadModel/fetchCorporationSummaries',
  async (_, thunkApi) => {
    const forbidden = requirePlatformAdmin(thunkApi);
    if (forbidden) return forbidden;
    try {
      const rows = await platformAdminRequest('platform-admin/corporations', {}, thunkApi);
      if (!Array.isArray(rows)) throw new Error('The corporations endpoint returned an unsupported response.');
      return rows.reduce((summaries, row) => {
        const id = row?.municipality_id ?? row?.corporation_id;
        if (id !== undefined && id !== null) {
          summaries[String(id)] = {
            applications: row.applications,
          };
        }
        return summaries;
      }, {});
    } catch (error) {
      return thunkApi.rejectWithValue({ message: error?.message || 'Unable to load corporation summaries.' });
    }
  },
);

export const fetchPlatformAdminSettings = createAsyncThunk(
  'platformAdminReadModel/fetchSettings',
  async (_, thunkApi) => {
    const forbidden = requirePlatformAdmin(thunkApi);
    if (forbidden) return forbidden;
    try {
      return await platformAdminRequest('platform-admin/settings', {}, thunkApi);
    } catch (error) {
      return thunkApi.rejectWithValue({ message: error?.message || 'Unable to load Platform Admin settings.' });
    }
  },
);

export const fetchPlatformAdminRevenue = createAsyncThunk(
  'platformAdminReadModel/fetchRevenue',
  async (_, thunkApi) => {
    const forbidden = requirePlatformAdmin(thunkApi);
    if (forbidden) return forbidden;
    try {
      const response = await platformAdminRequest('platform-admin/revenue', {}, thunkApi);
      if (!response || typeof response !== 'object' || !Array.isArray(response.corporations)) {
        throw new Error('The revenue endpoint returned an unsupported response.');
      }
      return {
        total_gross_collection: response.total_gross_collection,
        total_tradezo_revenue: response.total_tradezo_revenue,
        total_municipal_share: response.total_municipal_share,
        corporations: response.corporations.map((row) => ({
          corporation_id: row.corporation_id,
          municipality_id: row.municipality_id,
          name: row.name,
          applications: row.applications,
          gross_collection: row.gross_collection,
          tradezo_revenue: row.tradezo_revenue,
          municipal_share: row.municipal_share,
        })),
      };
    } catch (error) {
      return thunkApi.rejectWithValue({ message: error?.message || 'Unable to load Platform Admin revenue.' });
    }
  },
);

export const updatePlatformAdminSettings = createAsyncThunk(
  'platformAdminReadModel/updateSettings',
  async (settings, thunkApi) => {
    const forbidden = requirePlatformAdmin(thunkApi);
    if (forbidden) return forbidden;
    try {
      return await platformAdminRequest('platform-admin/settings', {
        method: 'PATCH',
        body: settings,
      }, thunkApi);
    } catch (error) {
      return thunkApi.rejectWithValue({ message: error?.message || 'Unable to save Platform Admin settings.' });
    }
  },
);

const platformAdminReadModelSlice = createSlice({
  name: 'platformAdminReadModel',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformAdminCorporationSummaries.pending, (state) => {
        state.requests.corporations = 'pending';
        state.errors.corporations = null;
      })
      .addCase(fetchPlatformAdminCorporationSummaries.fulfilled, (state, action) => {
        state.requests.corporations = 'fulfilled';
        state.errors.corporations = null;
        state.corporationSummariesByMunicipalityId = action.payload;
      })
      .addCase(fetchPlatformAdminCorporationSummaries.rejected, (state, action) => {
        state.requests.corporations = 'rejected';
        state.errors.corporations = action.payload?.message || action.error.message || 'Unable to load corporation summaries.';
      })
      .addCase(fetchPlatformAdminSettings.pending, (state) => {
        state.requests.fetchSettings = 'pending';
        state.errors.fetchSettings = null;
      })
      .addCase(fetchPlatformAdminSettings.fulfilled, (state, action) => {
        state.requests.fetchSettings = 'fulfilled';
        state.errors.fetchSettings = null;
        state.settings = action.payload;
      })
      .addCase(fetchPlatformAdminSettings.rejected, (state, action) => {
        state.requests.fetchSettings = 'rejected';
        state.errors.fetchSettings = action.payload?.message || action.error.message || 'Unable to load Platform Admin settings.';
      })
      .addCase(updatePlatformAdminSettings.pending, (state) => {
        state.requests.updateSettings = 'pending';
        state.errors.updateSettings = null;
      })
      .addCase(updatePlatformAdminSettings.fulfilled, (state, action) => {
        state.requests.updateSettings = 'fulfilled';
        state.errors.updateSettings = null;
        state.settings = action.payload;
      })
      .addCase(updatePlatformAdminSettings.rejected, (state, action) => {
        state.requests.updateSettings = 'rejected';
        state.errors.updateSettings = action.payload?.message || action.error.message || 'Unable to save Platform Admin settings.';
      })
      .addCase(fetchPlatformAdminRevenue.pending, (state) => {
        state.requests.fetchRevenue = 'pending';
        state.errors.fetchRevenue = null;
      })
      .addCase(fetchPlatformAdminRevenue.fulfilled, (state, action) => {
        state.requests.fetchRevenue = 'fulfilled';
        state.errors.fetchRevenue = null;
        state.revenue = action.payload;
      })
      .addCase(fetchPlatformAdminRevenue.rejected, (state, action) => {
        state.requests.fetchRevenue = 'rejected';
        state.errors.fetchRevenue = action.payload?.message || action.error.message || 'Unable to load Platform Admin revenue.';
      });
    resetOnAuthChange(builder, initialState);
  },
});

export const selectPlatformAdminReadModel = (state) => state.platformAdminReadModel;
export const selectPlatformAdminCorporationSummaries = (state) => selectPlatformAdminReadModel(state).corporationSummariesByMunicipalityId;
export const selectPlatformAdminSettings = (state) => selectPlatformAdminReadModel(state).settings;
export const selectPlatformAdminRevenue = (state) => selectPlatformAdminReadModel(state).revenue;
export const selectPlatformAdminReadModelRequest = (state, operation) => selectPlatformAdminReadModel(state).requests[operation];
export const selectPlatformAdminReadModelError = (state, operation) => selectPlatformAdminReadModel(state).errors[operation];

export default platformAdminReadModelSlice.reducer;
