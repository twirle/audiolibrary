import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CdkTableModule } from '@angular/cdk/table';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  TableVirtualScrollModule,
  TableVirtualScrollDataSource,
} from 'ng-table-virtual-scroll';

import { Track } from '../models/track.model';
import { TrackService } from '../services/track.service';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    SearchComponent,
    ScrollingModule,
    CdkTableModule,
    TableVirtualScrollModule,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  tracks: Track[] = [];
  filteredTracks: Track[] = [];
  searchTerm: string = '';
  currentPage = 1;
  totalPages = 1;

  // home component columns
  displayedColumns: string[] = [
    'albumArt',
    'title',
    'artist',
    'album',
    'year',
    'duration',
  ];
  mobileColumns: string[] = ['albumArt', 'title', 'artist', 'album'];
  dataSource = new TableVirtualScrollDataSource<Track>();

  constructor(
    private trackService: TrackService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadAllTracks();
  }

  loadAllTracks(): void {
    this.trackService
      .getAllTracks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tracks) => {
          // console.log('sample track:', tracks[1]);
          this.tracks = tracks;
          this.filteredTracks = [...this.tracks];
          this.dataSource.data = this.filteredTracks;
        },
        error: (error) => console.error('Error:', error),
      });
  }

  onSearchChanged(searchTerm: string): void {
    this.searchTerm = searchTerm;

    if (!this.searchTerm) {
      this.filteredTracks = [...this.tracks];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredTracks = this.tracks.filter(
        (track) =>
          track.title?.toLowerCase().includes(term) ||
          track.artist?.toLowerCase().includes(term) ||
          track.album?.toLowerCase().includes(term)
      );
    }

    this.dataSource.data = this.filteredTracks;
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
