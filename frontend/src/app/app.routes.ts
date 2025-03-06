import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AlbumComponent } from './album/album.component';
import { ArtistComponent } from './artist/artist.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent,
    // title: 'audiolibrary'
  },
  {
    path: 'album/:albumTitle',
    component: AlbumComponent,
    // title: 'Album Details',
  },
  { path: 'artists', component: ArtistComponent },
  { path: 'albums', component: AlbumComponent },
];
