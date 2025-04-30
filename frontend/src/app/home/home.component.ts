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
  loading = false;
  hasMoreTracks = true;

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
    this.trackService.tracks$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tracks) => {
        this.tracks = tracks;
        this.applySearch();
      });

    this.loadInitialTracks();
  }

  loadInitialTracks(): void {
    this.loading = true;
    this.trackService
      .initializeVirtualScrolling(500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading initial tracks:', error);
          this.loading = false;
        },
      });
  }

  loadMoreTracks(): void {
    if (this.loading || !this.hasMoreTracks) return;

    this.loading = true;
    this.trackService
      .loadMoreTracks(200)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (hasMore) => {
          this.hasMoreTracks = hasMore;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading more tracks:', error);
          this.loading = false;
        },
      });
  }

  onSearchChanged(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applySearch();
  }

  private applySearch(): void {
    if (!this.searchTerm) {
      this.filteredTracks = [...this.tracks];
    } else {
      const term = this.searchTerm.toLowerCase();
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
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
