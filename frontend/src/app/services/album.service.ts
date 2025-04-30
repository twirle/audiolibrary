import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import { EventBusService } from './event-bus.service';

interface Album {
  id: number;
  name: string;
  artist: any;
  albumArt?: any;
  tracks: any[];
  year?: number;
}

@Injectable({ providedIn: 'root' })
export class AlbumService {
  private apiBaseUrl = '/api';

  // cache for currently loaded album
  private currentAlbumSubject = new BehaviorSubject<Album | null>(null);
  public currentAlbum$ = this.currentAlbumSubject.asObservable();

  // store the current album ID being viewed
  private currentAlbumId: number | null = null;

  constructor(private http: HttpClient, private eventBus: EventBusService) {
    // listen for library updates
    this.eventBus.on('LIBRARY_UPDATED').subscribe(() => {
      // Refresh current album if one is loaded
      if (this.currentAlbumId) {
        this.getAlbumById(this.currentAlbumId).subscribe();
      }
    });

    // add handler for library reset events
    this.eventBus.on('LIBRARY_RESET').subscribe(() => {
      // clear cached album state when database is reset
      this.clearCurrentAlbum();
      console.log('Album cache cleared due to library reset');
    });
  }

  getAlbumById(albumId: number): Observable<Album> {
    // store the album ID being requested
    this.currentAlbumId = albumId;

    return this.http.get<Album>(`${this.apiBaseUrl}/albums/${albumId}`).pipe(
      map((album) => {
        // store in subject for future access
        this.currentAlbumSubject.next(album);
        return album;
      }),
      catchError((error) => {
        console.error('Error loading album details:', error);
        return of(null as any);
      })
    );
  }

  // get all albums for an artist
  getAlbumsByArtist(artistId: number): Observable<Album[]> {
    return this.http.get<any>(`${this.apiBaseUrl}/artists/${artistId}`).pipe(
      map((response) => response.albums || []),
      catchError((error) => {
        console.error('Error loading artist albums:', error);
        return of([]);
      })
    );
  }

  // clear the current album
  clearCurrentAlbum(): void {
    this.currentAlbumId = null;
    this.currentAlbumSubject.next(null);
  }
}
