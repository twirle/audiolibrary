import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Track } from '../models/track.model';

@Injectable({ providedIn: 'root' })
export class TrackService {
  private apiUrl = 'http://localhost:5000/api/audio-metadata';

  constructor(private http: HttpClient) {}

  getTracks(): Observable<Track[]> {
    return this.http.get<Track[]>(this.apiUrl);
  }

  getAlbumTracks(albumTitle: string): Observable<Track[]> {
    return this.getTracks().pipe(
      map((tracks) => tracks.filter((t) => t.album === albumTitle))
    );
  }
}
