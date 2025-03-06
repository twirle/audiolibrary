import { Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrackService } from '../services/track.service';
import { Track } from '../models/track.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-album',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css'],
})
export class AlbumComponent implements OnInit {
  private returnState: any;
  albumTracks: Track[] = [];
  albumDetails?: {
    title: string;
    artist: string;
    year: string;
    genre: string;
    totalDuration: number;
    coverArt?: string;
  };
  returnToArtist?: string;

  constructor(
    private route: ActivatedRoute,
    private trackService: TrackService,
    private destroyRef: DestroyRef,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.returnToArtist = navigation?.extras.state?.['returnToArtist'];
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const albumTitle = params.get('albumTitle');
        if (albumTitle) {
          this.loadAlbumData(albumTitle);
        }
      });
  }

  private loadAlbumData(albumTitle: string): void {
    this.trackService.getAlbumTracks(albumTitle).subscribe({
      next: (tracks) => {
        this.albumTracks = tracks;
        if (tracks.length > 0) {
          this.albumDetails = {
            title: tracks[0].album,
            artist: tracks[0].artist,
            year: tracks[0].year,
            genre: tracks[0].genre,
            totalDuration: tracks.reduce(
              (sum, track) => sum + track.duration,
              0
            ),
            coverArt: tracks[0].images[0]?.data,
          };
        }
      },
      error: (err) => console.error('Error loading album:', err),
    });
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // backtoArtist(): void {
  //   if (this.returnState.returnToArtist) {
  //     this.router.navigate(['/artists'], {
  //       state: {
  //         artist: this.returnState.returnToArtist,
  //         searchQuery: this.returnState.searchQuery,
  //         scrollPosition: this.returnState.scrollPosition,
  //       },
  //     });
  //   } else {
  //     this.navigation.backToPrevious();
  //   }
  // }

  backToArtist(): void {
    if (this.returnToArtist) {
      this.router.navigate(['/artists'], {
        state: {
          artist: this['returnToArtist'],
          scrollPosition: history.state.scrollPosition || 0,
        },
      });
    }
  }
}
