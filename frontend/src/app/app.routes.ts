import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AlbumComponent } from './album/album.component';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent, title: 'audiolibrary' },
  {
    path: 'album/:albumTitle',
    component: AlbumComponent,
    title: 'Album Details',
  },
];
