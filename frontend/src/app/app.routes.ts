import { Routes } from '@angular/router';
import { AudioFileListComponent } from './audio-file-list/audio-file-list.component';
import { AlbumPageComponent } from './album-page/album-page.component';

export const routes: Routes = [
  { path: '', component: AudioFileListComponent, pathMatch: 'full' },
  { path: 'album/:albumName', component: AlbumPageComponent },
];
