import { Component, DestroyRef, OnInit } from '@angular/core';
import { ArtistService } from '../services/artist.service';
import { Artist, AlbumSummary } from '../models/artist.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Add this import
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Add this
    RouterModule,
  ],
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.css'],
})
export class ArtistComponent implements OnInit {
  artists: Artist[] = [];
  selectedArtist: Artist | null = null;
  searchQuery = '';

  constructor(
    private artistService: ArtistService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.artistService
      .getArtists()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (artists) => (this.artists = artists),
        error: (err) => console.error('Error loading artists:', err),
      });
  }

  filteredArtists(): Artist[] {
    return this.artists.filter((artist) =>
      artist.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }
}
