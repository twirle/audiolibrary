import { Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlbumService } from '../services/album.service';

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
    private albumService: AlbumService,
    private destroyRef: DestroyRef,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
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

    this.albumService.currentAlbum$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((album) => {
        if (album) {
          this.album;
        }
      });
  }

  loadAlbum(albumId: number): void {
    this.albumService.getAlbumById(albumId).subscribe({
      next: (album) => {
        if (album) {
          this.album = album;
        } else {
          this.router.navigate(['/home']); // navigate to a safe route
        }
      },
      error: (err) => {
        console.error('Error loading album:', err);
        this.router.navigate(['/home']); // navigate to a safe route on error
      },
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
      (sum: any, track: { duration: any }) => sum + (track.duration || 0),
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
