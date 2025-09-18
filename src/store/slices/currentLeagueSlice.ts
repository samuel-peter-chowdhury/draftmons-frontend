import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { League } from '@/types/league.types';

interface CurrentLeagueState {
  league: League | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrentLeagueState = {
  league: null,
  loading: false,
  error: null,
};

const currentLeagueSlice = createSlice({
  name: 'currentLeague',
  initialState,
  reducers: {
    setCurrentLeague: (state, action: PayloadAction<League>) => {
      state.league = action.payload;
      state.error = null;
    },
    clearCurrentLeague: (state) => {
      state.league = null;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCurrentLeague, clearCurrentLeague, setLoading, setError } = 
  currentLeagueSlice.actions;

// Selectors
export const selectCurrentLeague = (state: { currentLeague: CurrentLeagueState }) => 
  state.currentLeague.league;
export const selectCurrentLeagueLoading = (state: { currentLeague: CurrentLeagueState }) => 
  state.currentLeague.loading;
export const selectCurrentLeagueError = (state: { currentLeague: CurrentLeagueState }) => 
  state.currentLeague.error;

export default currentLeagueSlice.reducer;