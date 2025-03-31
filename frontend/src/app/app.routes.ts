import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AlbumComponent } from './album/album.component';
import { ArtistComponent } from './artist/artist.component';
import { SettingsComponent } from './settings/settings.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'album/:albumId', component: AlbumComponent },
  { path: 'artists', component: ArtistComponent },
  { path: 'artists/:artistId', component: ArtistComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }, // wildcard to redirect home
];
