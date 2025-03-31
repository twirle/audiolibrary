import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FolderService {
  constructor(private http: HttpClient) {}

  // temp audio source input folder
  saveMusicFolderPath(path: string): Observable<any> {
    return this.http.post('/api/set-music-folder', { path });
  }

  getMusicFolderPath(): Observable<{ path: string }> {
    return this.http.get<{ path: string }>('/api/get-music-folder');
  }

  // future electron
  selectFolder(): Observable<string> {
    return this.getMusicFolderPath().pipe(
      map((response: { path: any }) => response.path)
    );

    // later with Electron:
    // return from(window.electron.showDirectoryPicker());
  }
}
