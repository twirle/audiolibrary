import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Artist } from '../models/artist.model';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private apiBaseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getArtists(): Observable<Artist[]> {
    return this.http.get<Artist[]>(`${this.apiBaseUrl}/artists`);
  }

  getArtistById(artistId: number): Observable<Artist> {
    return this.http.get<Artist>(`${this.apiBaseUrl}/artists/${artistId}`).pipe(
      map((response) => {
        return {
          ...response,
          genres: response.genres || [],
        };
      })
    );
  }
}
