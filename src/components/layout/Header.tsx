"use client";

import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Switch,
  Typography,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import CatchingPokemonIcon from "@mui/icons-material/CatchingPokemon";
import { useColorMode } from "@/contexts/ColorModeContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authLogout, selectUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { LeagueInputDto } from "../../dtos/league.dto";
import leagueService from "../../services/api/league.service";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showMenuButton = false,
}) => {
  const { mode, toggleColorMode } = useColorMode();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [leagues, setLeagues] = useState<Array<LeagueInputDto>>(
    new Array<LeagueInputDto>()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await dispatch(authLogout());
    router.push("/");
  };

  const handleHomeClick = () => {
    router.push("/home");
  };

  const handleLeagueClick = (id: number) => {
    router.push("/league/" + id);
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await leagueService.getAll(false, 1, 10, {
        ids: user?.leagueUsers?.map((lu) => lu.leagueId),
      });
      setLeagues(response.data);
    } catch (err) {
      setError("Failed to load leagues");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
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
          {leagues.map((league) => (
            <Button
              color="inherit"
              onClick={() => handleLeagueClick(league.id)}
              aria-label={league.abbreviation}
            >
              <CatchingPokemonIcon />
              <Typography marginLeft={1} key={league.id}>
                {league.abbreviation}
              </Typography>
            </Button>
          ))}
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={mode === "light" ? "Light Mode" : "Dark Mode"}>
            <Switch
              checked={mode === "dark"}
              onChange={toggleColorMode}
              color="default"
              inputProps={{ "aria-label": "theme toggle" }}
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
