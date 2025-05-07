import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  filter,
  map,
  of,
  switchMap,
  take,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { EventBusService } from './event-bus.service';
import { NotificationService } from './notification.service';

interface ScanStatus {
  isScanning: boolean;
  lastResult: ScanResult | null;
  startTime?: string;
  completedTime?: string;
}

interface ScanResult {
  status: 'success' | 'error' | 'cancelled';
  success?: number;
  errors?: number;
  total?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  constructor(
    private http: HttpClient,
    private eventBus: EventBusService,
    private notificationService: NotificationService
  ) {}

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
    // show notification
    const notificationId = this.notificationService.show(
      'Scanning library...',
      'info',
      false
    );

    return this.http.post('/api/scan-library', { path }).pipe(
      switchMap((initialResponse) => {
        // polling for scan completion
        return this.pollScanCompletion().pipe(
          // when complete, return the final result
          tap((finalResult) => {
            // Dismiss the "in progress" notification
            this.notificationService.dismiss(notificationId);

            // show success notification
            if (!finalResult) {
              this.notificationService.show(
                'Scan completed with unknown status',
                'warning'
              );
              this.eventBus.emit('LIBRARY_UPDATED', { path });
              return;
            }

            //  show success notification
            else if (finalResult.status === 'success') {
              this.notificationService.show(
                `Scan completed: ${finalResult.success} files processed, ${finalResult.errors} errors`,
                'success'
              );
            }
            // show error notification
            else if (finalResult.status === 'error') {
              this.notificationService.show(
                `Scan failed: ${finalResult.message}`,
                'error'
              );
            }
            // show cancelled notification
            else if (finalResult.status === 'cancelled') {
              this.notificationService.show('Scan cancelled', 'warning');
            }

            // show unknown error notification
            else {
              this.notificationService.show(
                `Scan failed: ${finalResult.message}`,
                'error'
              );
            }

            // emit event with the final result
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
      // Get scan status every 2 seconds
      switchMap(() => this.http.get<any>('/api/scan-status')),

      // Continue polling while scan is in progress or no result yet
      takeWhile(
        (status) => status.isScanning === true || status.lastResult === null,
        true
      ),

      // Only emit when scan is complete with a result
      filter((status) => !status.isScanning && status.lastResult !== null),

      // Take only the first matching result and complete
      take(1),

      // Return just the result object
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
