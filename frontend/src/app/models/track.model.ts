export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  albumId: number;
  genre: string | null;
  duration: number;
  trackNumber: number;
  year: number | null;
  albumArt: {
    data: string;
    mimeType: string;
  } | null;
}

export interface PaginatedResponse<T> {
  tracks: T[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}
