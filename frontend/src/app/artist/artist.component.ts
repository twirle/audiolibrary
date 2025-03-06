import { Component, DestroyRef, OnInit } from '@angular/core';
import { ArtistService } from '../services/artist.service';
import { NavigationService } from '../services/navigation.service';
import { Artist, AlbumSummary } from '../models/artist.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.css'],
})
export class ArtistComponent implements OnInit {
  artists: Artist[] = [];
  selectedArtist: Artist | null = null;
  searchQuery = '';
  private preservedState: any;

  constructor(
    private artistService: ArtistService,
    private destroyRef: DestroyRef,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.preservedState = this.router.getCurrentNavigation()?.extras.state;
  }

  ngOnInit(): void {
    this.artistService
      .getArtists()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (artists) => {
          this.artists = artists;
          this.handlePreservedState();
        },
        error: (err) => console.error('Error loading artists:', err),
      });
  }

  private handlePreservedState(): void {
    if (this.preservedState) {
      // restore selected artist
      this.selectedArtist =
        this.artists.find((a) => a.name === this.preservedState.artist) || null;

      if (this.preservedState.searchQuery) {
        this.searchQuery = this.preservedState.searchQuery;
      }

      // restore scroll position after render
      setTimeout(() => {
        if (this.preservedState.scrollPosition) {
          window.scrollTo(0, this.preservedState.scrollPosition);
        }
      }, 0);
    }
  }

  selectArtist(artistName: string): void {
    this.selectedArtist =
      this.artists.find((a) => a.name === artistName) || null;
    if (this.selectedArtist) {
      this.navigation.storeArtistState(artistName, {
        scrollPosition: window.scrollY,
        searchQuery: this.searchQuery,
      });
    }
  }

  clearSelection(): void {
    this.selectedArtist = null;
    this.searchQuery = '';
    this.navigation.clearArtistState;
  }

  filteredArtists(): Artist[] {
    return this.artists.filter((artist) =>
      artist.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  trackByArtist(index: number, artist: Artist): string {
    return artist.name;
  }

  trackByAlbum(index: number, album: AlbumSummary): string {
    return album.title;
  }
}
