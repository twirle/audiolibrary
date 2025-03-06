export interface Track {
  filepath: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  bitrate: string;
  track: number;
  tracktotal: number;
  year: string;
  duration: number;
  images: { data: string; mime_type: string }[];
}
