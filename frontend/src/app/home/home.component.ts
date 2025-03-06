import { Component, DestroyRef, OnInit } from '@angular/core';
import { TrackService } from '../services/track.service';
import { Track } from '../models/track.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  tracks: Track[] = [];

  constructor(
    private trackService: TrackService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.trackService
      .getTracks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => (this.tracks = data),
        error: (error) => console.error('Error:', error),
      });
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
