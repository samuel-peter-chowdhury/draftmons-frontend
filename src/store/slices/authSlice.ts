import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types/auth.types';
import authService from '@/services/api/auth.service';

const initialState: AuthState = {
  status: 'idle',
  user: null,
  error: null,
  returnTo: null,
};

// Thunks
export const hydrateAuth = createAsyncThunk(
  'auth/hydrate',
  async () => {
    const response = await authService.checkStatus();
    return response;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    startLogin: (state, action: PayloadAction<string | undefined>) => {
      state.returnTo = action.payload || null;
      // Redirect to Google OAuth
      if (typeof window !== 'undefined') {
        window.location.href = authService.getGoogleAuthUrl(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setReturnTo: (state, action: PayloadAction<string | null>) => {
      state.returnTo = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Hydrate Auth
      .addCase(hydrateAuth.pending, (state) => {
        state.status = 'checking';
        state.error = null;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        if (action.payload.authenticated && action.payload.user) {
          state.status = 'authenticated';
          state.user = action.payload.user;
        } else {
          state.status = 'unauthenticated';
          state.user = null;
        }
        state.error = null;
      })
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.error = action.error.message || 'Failed to check auth status';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.error = null;
        state.returnTo = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to logout';
      });
  },
});

export const { startLogin, clearError, setReturnTo } = authSlice.actions;

// Selectors
export const selectIsAuthed = (state: { auth: AuthState }) => 
  state.auth.status === 'authenticated';
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectReturnTo = (state: { auth: AuthState }) => state.auth.returnTo;

export default authSlice.reducer;