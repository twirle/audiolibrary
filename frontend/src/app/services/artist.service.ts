import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of, tap } from 'rxjs';
import { Artist } from '../models/artist.model';
import { EventBusService } from './event-bus.service';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private apiBaseUrl = '/api';
  private artistsSubject = new BehaviorSubject<Artist[]>([]);
  public artists$ = this.artistsSubject.asObservable();

  // track currently selected artistID
  private currentArtistId: number | null = null;

  constructor(private http: HttpClient, private eventBus: EventBusService) {
    // initial load
    this.loadArtists();

    // listen for library update
    this.eventBus.on('LIBRARY_UPDATED').subscribe(() => {
      this.loadArtists();
    });

    // add handler for library reset events
    this.eventBus.on('LIBRARY_RESET').subscribe(() => {
      console.log('Library reset event received, clearing artist cache');

      // clear the current artists list
      this.artistsSubject.next([]);

      // reset selected artist
      this.currentArtistId = null;
    });
  }

  private loadArtists(): void {
    console.log('Loading artists...');
    this.http
      .get<Artist[]>(`${this.apiBaseUrl}/artists`)
      .pipe(
        tap((artists) => console.log('Raw API response for artists:', artists)),
        catchError((error) => {
          console.error('Error loading artists', error);
          return of([]);
        })
      )
      .subscribe({
        next: (artists) => {
          console.log('Setting artists in subject:', artists);
          this.artistsSubject.next(artists);
        },
        error: (err) => console.error('Unexpected error in subscribe:', err),
      });
  }

  getArtistById(artistId: number): Observable<Artist> {
    // store current artist ID being viewed
    this.currentArtistId = artistId;

    return this.http.get<Artist>(`${this.apiBaseUrl}/artists/${artistId}`).pipe(
      map((response) => {
        return {
          ...response,
          genres: response.genres || [],
        };
      }),
      catchError((error) => {
        console.error(`Error loading artist ${artistId}:`, error);
        return of(null as any);
      })
    );
  }
}
