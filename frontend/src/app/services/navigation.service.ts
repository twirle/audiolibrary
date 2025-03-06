import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private history: string[] = [];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.history.push(event.urlAfterRedirects);
      });
  }

  backToPrevious(): void {
    this.history.pop();
    if (this.history.length > 0) {
      this.router.navigateByUrl(this.history.pop()!);
    } else {
      this.router.navigate(['/']);
    }
  }

  storeArtistState(artistName: string, state: any): void {
    localStorage.setItem(
      'artistState',
      JSON.stringify({
        artist: artistName,
        ...state,
      })
    );
  }

  clearArtistState(): void {
    localStorage.removeItem('artistState');
  }
}
