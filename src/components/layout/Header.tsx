'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Switch,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useColorMode } from '@/contexts/ColorModeContext';
import { LeaguesAccordion } from './LeaguesAccordion';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { useRouter, usePathname } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { mode, toggleColorMode } = useColorMode();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're on a league-specific page
  const isLeaguePage = pathname.startsWith('/leagues/') && pathname.split('/').length > 2;

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1} gap={2}>
          {isLeaguePage && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuClick}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          <LeaguesAccordion />
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={mode === 'light' ? 'Light Mode' : 'Dark Mode'}>
            <Switch
              checked={mode === 'dark'}
              onChange={toggleColorMode}
              color="default"
              inputProps={{ 'aria-label': 'theme toggle' }}
            />
          </Tooltip>
          
          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};