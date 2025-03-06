import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex min-h-screen">
      <app-sidebar></app-sidebar>
      <main class="flex-1 ml-48">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [],
})
export class AppComponent {
  title = 'frontend';
}
