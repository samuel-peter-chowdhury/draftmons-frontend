'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Switch
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import { useColorMode } from '@/contexts/ColorModeContext';
import { useAppDispatch } from '@/store/hooks';
import { authLogout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton = false }) => {
  const { mode, toggleColorMode } = useColorMode();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(authLogout());
    router.push('/');
  };

  const handleHomeClick = () => {
    router.push('/home');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1} gap={2}>
          {showMenuButton && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuClick}
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <IconButton
            color="inherit"
            onClick={handleHomeClick}
            aria-label="home"
          >
            <HomeIcon />
          </IconButton>
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