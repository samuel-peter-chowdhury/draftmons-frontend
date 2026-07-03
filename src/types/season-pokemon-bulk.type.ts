// Mirror of backend DTOs (draftmons-backend/src/dtos/season-pokemon-bulk.dto.ts)

export enum BulkUpsertErrorCode {
  POKEMON_NOT_FOUND = 'POKEMON_NOT_FOUND',
  INVALID_POINT_VALUE = 'INVALID_POINT_VALUE',
}

export enum BulkUpsertEntryStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export interface BulkUpsertEntryInput {
  name: string;
  pointValue?: number;
}

export interface BulkUpsertInput {
  seasonId: number;
  entries: BulkUpsertEntryInput[];
}

export interface BulkUpsertEntryResult {
  name: string;
  pointValue: number | undefined;
  status: BulkUpsertEntryStatus;
  code?: BulkUpsertErrorCode;
  message?: string;
}
