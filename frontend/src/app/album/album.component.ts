// album.component.ts
import { Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackService } from '../services/track.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-album',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './album.component.html',
})
export class AlbumComponent implements OnInit {
  album: any;
  returnToArtist?: string;
  scrollPosition: number = 0;

  constructor(
    private route: ActivatedRoute,
    private trackService: TrackService,
    private destroyRef: DestroyRef,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    // console.log('Navigation state received:', navigation?.extras?.state);
    // console.log('Scroll position:', navigation?.extras?.state?.['scrollPosition']);

    this.returnToArtist = navigation?.extras.state?.['returnToArtist'];
    this.scrollPosition = navigation?.extras.state?.['scrollPosition'] || 0;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const albumId = params.get('albumId');
        if (albumId) {
          this.loadAlbum(+albumId);
        }
      });
  }

  loadAlbum(albumId: number): void {
    this.trackService.getAlbumById(albumId).subscribe({
      next: (album) => {
        this.album = album;
      },
      error: (err) => console.error('Error loading album:', err),
    });
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getTotalDuration(): number {
    if (!this.album?.tracks) return 0;
    return this.album.tracks.reduce(
      (sum: any, t: { duration: any }) => sum + t.duration,
      0
    );
  }

  backToArtist(): void {
    if (this.returnToArtist) {
      this.router.navigate(['/artists'], {
        state: {
          artist: this.returnToArtist,
          artistId: history.state.artistId,
          scrollPosition: this.scrollPosition,
        },
      });
    }
  }
}
