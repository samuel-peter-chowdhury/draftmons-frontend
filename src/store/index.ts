import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import currentLeagueReducer from './slices/currentLeagueSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    currentLeague: currentLeagueReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;