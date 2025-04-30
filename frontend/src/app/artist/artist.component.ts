import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { ArtistService } from '../services/artist.service';
import { NavigationService } from '../services/navigation.service';
import { AlbumSummary, Artist } from '../models/artist.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventBusService } from '../services/event-bus.service';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './artist.component.html',
})
export class ArtistComponent implements OnInit {
  artists: Artist[] = [];
  selectedArtist: Artist | null = null;
  searchQuery = '';
  JSON = JSON;

  constructor(
    private artistService: ArtistService,
    private destroyRef: DestroyRef,
    private navigation: NavigationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private eventBus: EventBusService
  ) {}

  ngOnInit(): void {
    // subscribe to artists$ Observable
    this.artistService.artists$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (artists) => {
          this.artists = artists;
          this.checkForArtistInRoute();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error with artists subscription:', err),
      });

    // subscribe to library_updated event
    this.eventBus
      .on('LIBRARY_UPDATED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        console.log('Library updated event receive in component');

        for (let i = 1; i <= 3; i++) {
          setTimeout(() => {
            console.log(`Force refresh attempt ${i}`);
            this.artistService.loadArtists();
            this.cdr.detectChanges();
          }, i * 500);
        }
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const scrollPosition = history.state?.scrollPosition;
      if (scrollPosition) {
        window.scrollTo(0, scrollPosition);
      }
    }, 100);
  }

  private checkForArtistInRoute(): void {
    this.route.paramMap.subscribe((params) => {
      const artistId = params.get('artistId');

      if (artistId) {
        this.selectArtistById(+artistId);
      } else {
        // check navigation state
        const state = this.router.getCurrentNavigation()?.extras.state;
        if (state?.['artistId']) {
          this.selectArtistById(state['artistId']);
        } else {
          // check stored state
          const storedState = this.navigation.getStoredArtistState();
          if (storedState?.artistId) {
            this.selectArtistById(storedState.artistId);
          }
        }
      }
    });
  }

  selectArtistById(artistId: number): void {
    this.artistService.getArtistById(artistId).subscribe({
      next: (artist) => {
        this.selectedArtist = artist;
        this.navigation.storeArtistState(artist.id, artist.name, {
          searchQuery: this.searchQuery,
          scrollPosition: window.scrollY,
        });
      },
      error: (err) => {
        if (err.status === 404) {
          this.selectedArtist = null;
          console.log('Artist not found, it may have been deleted');
        }
        console.error('Error loading artist details:', err);
      },
    });
  }

  clearSelection(): void {
    this.selectedArtist = null;
    this.searchQuery = '';
    this.navigation.clearArtistState();
  }

  filteredArtists(): Artist[] {
    return this.artists.filter((artist) =>
      artist.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  trackByArtistId(index: number, artist: Artist): number {
    return artist.id;
  }

  trackByAlbumId(index: number, album: AlbumSummary): number {
    return album.id;
  }

  navigateToAlbum(album: any): void {
    this.router.navigate(['/album', album.id], {
      state: {
        returnToArtist: this.selectedArtist?.name,
        artistId: this.selectedArtist?.id,
        searchQuery: this.searchQuery,
        scrollPosition: window.scrollY,
      },
    });
  }

  getScrollPosition(): number {
    return window.scrollY;
  }
}
