export interface Artist {
  name: string;
  albums: AlbumSummary[];
  totalTracks: number;
  genres: string[];
}

export interface AlbumSummary {
  title: string;
  year?: string;
  coverArt?: string;
  trackCount: number;
}
