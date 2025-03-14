import { Track } from './track.model';

export interface Album {
  id: number;
  name: string;
  artist: string;
  year?: number;
  genre?: string;
  genres?: string[];
  albumArt?: {
    data: string;
    mimeType: string;
  };
  tracks: Track[];
}
