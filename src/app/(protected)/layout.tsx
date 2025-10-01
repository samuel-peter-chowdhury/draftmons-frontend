"use client";

import React, { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { usePathname } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const leagueSeasonPathRegex: RegExp = /\/league\/\d+\/season\/\d+(\/.*)?/;
  const showMenuButton: boolean = leagueSeasonPathRegex.test(pathname);

  return (
    <RequireAuth>
      <Box sx={{ display: "flex" }}>
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={showMenuButton}
        />
        {showMenuButton && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar /> {/* Spacing for fixed header */}
          {children}
        </Box>
      </Box>
    </RequireAuth>
  );
}
