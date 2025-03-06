// src/app/services/artist.service.ts
import { Injectable } from '@angular/core';
import { TrackService } from './track.service';
import { Observable, map } from 'rxjs';
import { Artist, AlbumSummary } from '../models/artist.model';
import { Track } from '../models/track.model';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  constructor(private trackService: TrackService) {}

  getArtists(): Observable<Artist[]> {
    return this.trackService
      .getTracks()
      .pipe(map((tracks) => this.processArtists(tracks)));
  }

  private processArtists(tracks: Track[]): Artist[] {
    const artistsMap = new Map<string, Artist>();

    tracks.forEach((track) => {
      if (!track.artist) return;

      if (!artistsMap.has(track.artist)) {
        artistsMap.set(track.artist, this.createNewArtist(track));
      }

      this.updateArtist(artistsMap.get(track.artist)!, track);
    });

    return Array.from(artistsMap.values());
  }

  private createNewArtist(track: Track): Artist {
    return {
      name: track.artist || 'Unknown Artist',
      albums: [],
      totalTracks: 0,
      genres: [],
    };
  }

  private updateArtist(artist: Artist, track: Track): void {
    artist.totalTracks++;

    // update genres
    if (track.genre && !artist.genres.includes(track.genre)) {
      artist.genres.push(track.genre);
    }

    // update albums
    if (track.album) {
      const existingAlbum = artist.albums.find((a) => a.title === track.album);
      if (existingAlbum) {
        existingAlbum.trackCount++;
      } else {
        artist.albums.push({
          title: track.album,
          year: track.year,
          coverArt: track.images[0]?.data,
          trackCount: 1,
        });
      }
    }
  }
}
