import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OnInit, Component } from '@angular/core';

declare const $: any;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  audioDirectoryPath: string = '';
  isScanning: boolean = false;

  constructor(private http: HttpClient) {}
  ngOnInit(): void {
    this.getAudioDirectory();
  }

  getAudioDirectory(): void {
    this.http.get<{ path: string }>('/api/get-audio-directory').subscribe({
      next: (response) => {
        this.audioDirectoryPath = response.path;
      },
      error: (error) => console.error('Error fetching audio directory:', error),
    });
  }

  saveAudioDirectory(): void {
    this.http
      .post('/api/set-audio-directory', { path: this.audioDirectoryPath })
      .subscribe({
        next: () => {
          alert('Audio directory saved successfully');
        },
        error: (error) => {
          console.error('Error saving audio directory:', error);
          alert('Failed to save audio directory');
        },
      });
  }

  startScan(): void {
    this.isScanning = true;
    this.http
      .post('/api/scan-library', { path: this.audioDirectoryPath })
      .subscribe({
        next: () => {
          this.isScanning = false;
          alert('Library scan completed!');
        },
        error: () => {
          this.isScanning = false;
          alert('Scan failed! Check server logs.');
        },
      });
  }
}
