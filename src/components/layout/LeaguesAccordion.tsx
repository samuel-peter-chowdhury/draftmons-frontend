import React, { useState, useEffect } from 'react';
import { 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import leaguesService from '@/services/api/leagues.service';
import { League } from '@/types/league.types';

export const LeaguesAccordion: React.FC = () => {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchUserLeagues();
    }
  }, [expanded]);

  const fetchUserLeagues = async () => {
    setLoading(true);
    try {
      const userLeagues = await leaguesService.getUserLeagues();
      setLeagues(userLeagues);
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueClick = (leagueId: string) => {
    router.push(`/leagues/${leagueId}`);
    setExpanded(false);
  };

  return (
    <Accordion 
      expanded={expanded} 
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ 
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&:before': { display: 'none' },
        color: 'inherit',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'inherit' }} />}
        sx={{ 
          minHeight: 'auto',
          padding: 0,
          '& .MuiAccordionSummary-content': { margin: 0 }
        }}
      >
        <Typography>Leagues</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {leagues.map((league) => (
              <ListItem key={league.id} disablePadding>
                <ListItemButton onClick={() => handleLeagueClick(league.id)}>
                  <ListItemText primary={league.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  );
};