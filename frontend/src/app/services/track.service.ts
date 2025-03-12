import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Track, PaginatedResponse } from '../models/track.model';

@Injectable({ providedIn: 'root' })
export class TrackService {
  private apiBaseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getTracks(
    page: number = 1,
    perPage: number = 100
  ): Observable<PaginatedResponse<Track>> {
    return this.http.get<PaginatedResponse<Track>>(
      `${this.apiBaseUrl}/tracks?page=${page}&per_page=${perPage}`
    );
  }

  getAlbumById(albumId: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/albums/${albumId}`);
  }
}
