import { ConnectorConfig } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface MovieMetadata_Key {
  id: UUIDString;
  __typename?: 'MovieMetadata_Key';
}

export interface Movie_Key {
  id: UUIDString;
  __typename?: 'Movie_Key';
}

export interface Review_Key {
  userId: string;
  movieId: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

