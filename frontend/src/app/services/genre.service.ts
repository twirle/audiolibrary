import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Genre } from '../models/genre.model';

@Injectable({ providedIn: 'root' })
export class GenreService {
  private apiBaseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(`${this.apiBaseUrl}/genres`);
  }

  searchGenres(term: string): Observable<Genre[]> {
    return this.http.get<Genre[]>(
      `${this.apiBaseUrl}/genres/search?term=${encodeURIComponent(term)}`
    );
  }

  getGenreById(id: number): Observable<Genre> {
    return this.http.get<Genre>(`${this.apiBaseUrl}/genres/${id}`);
  }

  //   future edit genre
  updateGenre(id: number, data: { name: string }): Observable<Genre> {
    return this.http.put<Genre>(`${this.apiBaseUrl}/genres/${id}`, data);
  }

  addGenreAlias(genreId: number, alias: string): Observable<Genre> {
    return this.http.post<Genre>(
      `${this.apiBaseUrl}/genres/${genreId}/aliases`,
      { alias }
    );
  }
}
