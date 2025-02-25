import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    // AlbumPageComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AppComponent,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
