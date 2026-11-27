import { createAction } from '@reduxjs/toolkit';

// Keep the shared auth-clearing action independent from authSlice imports so
// request utilities can trigger logout without creating an ES module cycle.
export const clearCredentials = createAction('auth/clearCredentials');
