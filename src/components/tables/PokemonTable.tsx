import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import { Pokemon } from '@/types/pokemon.types';
import { visuallyHidden } from '@mui/utils';

interface PokemonTableProps {
  data: Pokemon[];
  total: number;
  page: number;
  rowsPerPage: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onSort?: (property: keyof Pokemon) => void;
  sortBy?: keyof Pokemon;
  sortOrder?: 'asc' | 'desc';
}

type Column = {
  id: keyof Pokemon;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  format?: (value: any) => React.ReactNode;
};

const columns: Column[] = [
  { 
    id: 'image', 
    label: 'Image', 
    align: 'center', 
    minWidth: 60,
    format: (value: string) => (
      <Avatar src={value} alt="Pokemon" sx={{ width: 40, height: 40 }} />
    )
  },
  { id: 'name', label: 'Name', minWidth: 100 },
  { 
    id: 'types', 
    label: 'Types', 
    minWidth: 120,
    format: (value: string[]) => (
      <Box display="flex" gap={0.5}>
        {value?.map((type) => (
          <Chip key={type} label={type} size="small" />
        ))}
      </Box>
    )
  },
  { 
    id: 'abilities', 
    label: 'Abilities', 
    minWidth: 150,
    format: (value: string[]) => value?.join(', ')
  },
  { id: 'team', label: 'Team', minWidth: 100 },
  { id: 'hp', label: 'HP', align: 'right', minWidth: 50 },
  { id: 'atk', label: 'Atk', align: 'right', minWidth: 50 },
  { id: 'def', label: 'Def', align: 'right', minWidth: 50 },
  { id: 'spa', label: 'SpA', align: 'right', minWidth: 50 },
  { id: 'spd', label: 'SpD', align: 'right', minWidth: 50 },
  { id: 'spe', label: 'Spd', align: 'right', minWidth: 50 },
  { id: 'bst', label: 'BST', align: 'right', minWidth: 60 },
  { id: 'pts', label: 'Pts', align: 'right', minWidth: 60 },
];

export const PokemonTable: React.FC<PokemonTableProps> = ({
  data,
  total,
  page,
  rowsPerPage,
  loading,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  sortBy,
  sortOrder = 'asc',
}) => {
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(+event.target.value);
    onPageChange(0);
  };

  const createSortHandler = (property: keyof Pokemon) => () => {
    if (onSort) {
      onSort(property);
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ py: 1, px: 1 }}
                >
                  {onSort && ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst', 'pts'].includes(column.id) ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'asc'}
                      onClick={createSortHandler(column.id)}
                    >
                      {column.label}
                      {sortBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {sortOrder === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((pokemon) => (
              <TableRow hover key={pokemon.id}>
                {columns.map((column) => {
                  const value = pokemon[column.id];
                  return (
                    <TableCell 
                      key={column.id} 
                      align={column.align}
                      sx={{ py: 0.5, px: 1 }}
                    >
                      {column.format ? column.format(value) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};