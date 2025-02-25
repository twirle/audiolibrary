import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClient and HttpClientModule
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-album-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './album-page.component.html',
  styleUrl: './album-page.component.css',
})
export class AlbumPageComponent implements OnInit {
  albumName: string | null = null;
  albumTracks: any[] = [];
  albumMetadata: any = null;
  totalRuntimeSeconds: number = 0;
  trackCount: number = 0;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    // Get album name from the route parameters
    this.route.paramMap.subscribe((params) => {
      this.albumName = params.get('albumName');
      if (this.albumName) {
        this.fetchAlbumData(this.albumName);
      }
    });
  }

  fetchAlbumData(albumName: string) {
    this.http
      .get<any[]>('http://localhost:5000/api/audio-metadata')
      .subscribe((audioFiles) => {
        this.albumTracks = audioFiles.map((track) => {
          let trackNumber = track.track;
          if (trackNumber) {
            trackNumber = parseInt(
              trackNumber.toString().replace(/[^0-9]/g, ''),
              10
            );
          } else {
            trackNumber = '';
          }
          return { ...track, track: trackNumber };
        });

        this.albumTracks = this.albumTracks.filter(
          (track) => track.album === albumName
        );

        this.totalRuntimeSeconds = 0;
        this.trackCount = this.albumTracks.length;

        if (this.albumTracks.length > 0) {
          this.albumMetadata = this.albumTracks[0];
          this.albumTracks.forEach((track) => {
            if (track.duration) {
              this.totalRuntimeSeconds += parseFloat(track.duration);
            }
          });
        } else {
          this.albumMetadata = null;
          this.totalRuntimeSeconds = 0; // Reset runtime if no tracks
        }
      });
  }

  formatDuration(durationInSeconds: number): string {
    if (!durationInSeconds) {
      return 'N/A';
    }
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isOdd(index: number): boolean {
    return (index + 1) % 2 !== 0;
  }

  formatRuntimeMinutes(totalSeconds: number): string {
    if (!totalSeconds) {
      return '0'; // Or handle null/undefined seconds as needed
    }
    const minutes = Math.round(totalSeconds / 60); // Convert seconds to minutes and round
    return minutes.toString();
  }
}
