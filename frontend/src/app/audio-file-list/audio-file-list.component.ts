import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audio-file-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './audio-file-list.component.html',
  styleUrls: ['./audio-file-list.component.css'],
})
export class AudioFileListComponent implements OnInit {
  audioFiles: any[] = [];
  filteredAudioFiles: any[] = [];
  @Output() audioFileSelected = new EventEmitter<any>();

  currentSortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchQuery: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAudioFiles();
  }

  fetchAudioFiles() {
    this.http
      .get<any[]>('http://localhost:5000/api/audio-metadata')
      .subscribe((data) => {
        this.audioFiles = data;
        this.filterAudioFiles();
        this.sortAudioFiles();
      });
  }

  onSelectAudioFile(audioFile: any) {
    console.log(
      'selectAudioFile method CALLED in AudioFileListComponent',
      audioFile
    );
    this.audioFileSelected.emit(audioFile);
  }

  formatDuration(durationInSeconds: number): string {
    if (!durationInSeconds) {
      return 'N/A';
    }
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  sortBy(column: string) {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortAudioFiles();
  }

  sortAudioFiles() {
    if (!this.currentSortColumn) {
      return;
    }

    this.filteredAudioFiles.sort((a: any, b: any) => {
      let aValue = a[this.currentSortColumn];
      let bValue = b[this.currentSortColumn];

      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      if (
        comparison === 0 &&
        (this.currentSortColumn === 'album' ||
          this.currentSortColumn === 'artist' ||
          this.currentSortColumn === 'year')
      ) {
        const trackA = a.track != null ? parseInt(a.track, 10) : Infinity;
        const trackB = b.track != null ? parseInt(b.track, 10) : Infinity;

        if (!isNaN(trackA) && !isNaN(trackB)) {
          if (trackA < trackB) {
            comparison = -1;
          } else if (trackA > trackB) {
            comparison = 1;
          }
        }
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  filterAudioFiles() {
    const searchTerm = this.searchQuery.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredAudioFiles = [...this.audioFiles];
    } else {
      this.filteredAudioFiles = this.audioFiles.filter((audioFile) => {
        const title = (audioFile.title || '').toLowerCase();
        const artist = (audioFile.artist || '').toLowerCase();
        const album = (audioFile.album || '').toLowerCase();

        return (
          title.includes(searchTerm) ||
          artist.includes(searchTerm) ||
          album.includes(searchTerm)
        );
      });
    }
    this.sortAudioFiles();
  }

  get displayedAudioFiles() {
    return this.filteredAudioFiles;
  }
}
