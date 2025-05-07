import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OnInit, Component, ChangeDetectorRef } from '@angular/core';
import { PreferencesService } from '../services/preferences.service';
import { error } from 'jquery';

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
  scanComplete: boolean = false;
  confirmReset: boolean = false;
  isSaving: boolean = false;
  hasSaved: boolean = false;

  constructor(
    private http: HttpClient,
    private preferencesService: PreferencesService,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.isSaving = true;

    this.http
      .post('/api/set-audio-directory', { path: this.audioDirectoryPath })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.hasSaved = true;

          // reset after 2 seconds
          setTimeout(() => {
            this.hasSaved = false;
          }, 2000);
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error saving audio directory:', error);
          alert('Failed to save audio directory');
        },
      });
  }

  startScan(): void {
    this.isScanning = true;
    this.scanComplete = false;

    this.preferencesService
      .scanLibraryWithReset(this.audioDirectoryPath)
      .subscribe({
        next: () => {
          this.isScanning = false;
          this.confirmReset = false;
          this.scanComplete = true;
          this.cdr.detectChanges(); // Force UI update
        },
        error: (error) => {
          this.isScanning = false;
          console.error('Error:', error);
          alert('Scan library failed, check logs.');
        },
      });
  }

  cancelScan(): void {
    this.isScanning = false;
    this.confirmReset = false;

    this.http.post('/api/cancel-scan', {}).subscribe({
      next: () => {
        console.log('Cancel request sent');
      },
      error: (error) => {
        console.error('Error cancelling scan:', error);
        alert('Failed to cancel scan');
      },
    });
  }
}
