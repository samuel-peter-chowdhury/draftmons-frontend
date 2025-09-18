'use client';

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Divider,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Groups,
  Layers,
  EmojiEvents,
  Build,
  AdminPanelSettings,
  Settings,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { SIDEBAR_NAVIGATION, SIDEBAR_BOTTOM_NAVIGATION } from '@/utils/constants';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const iconMap: { [key: string]: React.ElementType } = {
  Groups,
  Layers,
  EmojiEvents,
  Build,
  AdminPanelSettings,
  Settings,
};

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const router = useRouter();
  const params = useParams();
  const leagueId = params?.id as string;
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleItemClick = (item: typeof SIDEBAR_NAVIGATION[0], childPath?: string) => {
    const path = childPath || item.path;
    
    if (item.children.length > 0 && !childPath) {
      // Toggle accordion for parent items with children
      setOpenItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Navigate and close drawer for items without children or child items
      router.push(`/leagues/${leagueId}${path}`);
      onClose();
    }
  };

  const renderNavItem = (item: typeof SIDEBAR_NAVIGATION[0]) => {
    const Icon = iconMap[item.icon];
    const isOpen = openItems.includes(item.id);

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleItemClick(item)}>
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={item.label} />
            {item.children.length > 0 && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {item.children.length > 0 && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItem key={child.id} disablePadding>
                  <ListItemButton 
                    sx={{ pl: 4 }} 
                    onClick={() => handleItemClick(item, child.path)}
                  >
                    <ListItemText 
                      primary={child.label} 
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          mt: '64px', // Height of AppBar
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List sx={{ flexGrow: 1, pt: 2 }}>
          {SIDEBAR_NAVIGATION.map(renderNavItem)}
        </List>
        
        <Divider />
        
        <List sx={{ pb: 2 }}>
          {SIDEBAR_BOTTOM_NAVIGATION.map(renderNavItem)}
        </List>
      </Box>
    </Drawer>
  );
};