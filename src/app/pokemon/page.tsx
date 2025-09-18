'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Toolbar } from '@mui/material';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Header } from '@/components/layout/Header';
import { PokemonTable } from '@/components/tables/PokemonTable';
import { Loading } from '@/components/common/Loading';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import pokemonService from '@/services/api/pokemon.service';
import { Pokemon } from '@/types/pokemon.types';

export default function PokemonPage() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof Pokemon>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchPokemon();
  }, [page, rowsPerPage]);

  const fetchPokemon = async () => {
    setLoading(true);
    try {
      const response = await pokemonService.getAll(page + 1, rowsPerPage);
      setPokemon(response.data);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load Pokemon');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (property: keyof Pokemon) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  return (
    <RequireAuth>
      <Box sx={{ display: 'flex' }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="xl">
            <Typography variant="h4" component="h1" gutterBottom>
              Pokemon
            </Typography>
            <ErrorAlert error={error} />
            {loading && pokemon.length === 0 ? (
              <Loading />
            ) : (
              <PokemonTable
                data={pokemon}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                loading={loading}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                onSort={handleSort}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            )}
          </Container>
        </Box>
      </Box>
    </RequireAuth>
  );
}