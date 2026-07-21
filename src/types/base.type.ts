export interface BaseInput {
  id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional empty marker interface, extended by every *Output type
export interface BaseOutput {}
