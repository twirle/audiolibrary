import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { Track, PaginatedResponse } from '../models/track.model';
import { EventBusService } from './event-bus.service';

@Injectable({ providedIn: 'root' })
export class TrackService {
  private apiBaseUrl = '/api';
  private tracksSubject = new BehaviorSubject<Track[]>([]);
  public tracks$ = this.tracksSubject.asObservable();
  private currentPage = 1;
  private loading = false;
  private hasMore = true;

  constructor(private http: HttpClient, private eventBus: EventBusService) {
    this.eventBus.on('LIBRARY_UPDATED').subscribe(() => {
      // reset and reload tracks when library changes
      this.currentPage = 1;
      this.hasMore = true;
      this.initializeVirtualScrolling();
    });
  }

  // standard pagination
  getTracks(
    page: number = 1,
    perPage: number = 100,
    includeArt: boolean = false
  ): Observable<PaginatedResponse<Track>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (!includeArt) {
      params = params.set('include_art', 'false');
    }

    return this.http.get<PaginatedResponse<Track>>(
      `${this.apiBaseUrl}/tracks`,
      { params }
    );
  }

  // initialise virtual scrolling at start
  initializeVirtualScrolling(initialCount = 500): Observable<Track[]> {
    this.currentPage = 1;
    this.hasMore = true;
    this.loading = true;

    return this.getTracks(1, initialCount, false).pipe(
      tap((response) => {
        this.tracksSubject.next(response.tracks);
        this.hasMore = response.pagination.page < response.pagination.pages;
        this.loading = false;
      }),
      map((response) => response.tracks)
    );
  }

  // check for more tracks
  get hasMoreTracks(): boolean {
    return this.hasMore;
  }

  get isLoading(): boolean {
    return this.loading;
  }

  // load more as user scroll
  loadMoreTracks(chunkSize = 200): Observable<boolean> {
    if (this.loading || !this.hasMore) {
      return of(false);
    }

    this.loading = true;
    this.currentPage++;

    return this.getTracks(this.currentPage, chunkSize, false).pipe(
      map((response) => {
        const currentTracks = this.tracksSubject.value;
        const newTracks = [...currentTracks, ...response.tracks];

        this.tracksSubject.next(newTracks);
        this.loading = false;
        this.hasMore = response.pagination.page < response.pagination.pages;

        return this.hasMore;
      })
    );
  }

  // now in albumservice
  // getAlbumById(albumId: number): Observable<any> {
  //   return this.http.get(`${this.apiBaseUrl}/albums/${albumId}`);
  // }

  clearTracks(): void {
    this.tracksSubject.next([]);
    this.currentPage = 1;
    this.hasMore = true;
  }
}
