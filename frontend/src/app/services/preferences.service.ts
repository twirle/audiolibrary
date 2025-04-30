import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  filter,
  map,
  switchMap,
  take,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
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
      switchMap((initialResponse) => {
        // polling for scan completion
        return this.pollScanCompletion().pipe(
          // when complete, return the final result
          tap((finalResult) => {
            console.log('Scan completed with result:', finalResult);
            // emit event after scan actually completes
            this.eventBus.emit('LIBRARY_UPDATED', {
              path,
              result: finalResult,
            });
          })
        );
      })
    );
  }

  private pollScanCompletion(): Observable<any> {
    return timer(0, 2000).pipe(
      switchMap(() => this.http.get('/api/scan-status')),
      map((status) => status as any),
      // continue polling until isScanning becomes false
      takeWhile((status) => status.isScanning, true),
      // only return the final result
      filter((status) => !status.isScanning),
      take(1),
      map((status) => status.lastResult)
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
