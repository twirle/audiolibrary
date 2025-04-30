import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, tap } from 'rxjs';
import { EventBusService } from './event-bus.service';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  constructor(private http: HttpClient, private eventBus: EventBusService) {}

  getAudioDirectory(): Observable<string> {
    return this.http
      .get<{ path: string }>('/api/get-audio-directory')
      .pipe(map((response) => response.path));
  }

  saveAudioDirectory(path: string): Observable<any> {
    return this.http.post('/api/set-audio-directory', { path }).pipe(
      tap(() => {
        this.eventBus.emit('AUDIO_DIRECTORY_CHANGED', { path });
      })
    );
  }

  scanLibrary(path: string): Observable<any> {
    return this.http.post('/api/scan-library', { path }).pipe(
      tap(() => {
        this.eventBus.emit('LIBRARY_UPDATED', { path });
      })
    );
  }

  resetLibrary(): Observable<any> {
    return this.http.post('/api/reset-library', {}).pipe(
      tap(() => {
        this.eventBus.emit('LIBRARY_RESET');
      })
    );
  }

  scanLibraryWithReset(path: string): Observable<any> {
    return this.resetLibrary().pipe(switchMap(() => this.scanLibrary(path)));
  }
}
