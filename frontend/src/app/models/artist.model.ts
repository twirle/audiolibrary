export interface Artist {
  id: number;
  name: string;
  albums: AlbumSummary[];
  albumCount: number;
  trackCount: number;
  genres?: string[];
}

export interface AlbumSummary {
  id: number;
  name: string;
  year?: number;
  trackCount: number;
  albumArt?: {
    data: string;
    mimeType: string;
  };
}
