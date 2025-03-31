import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  navItems = [
    { label: 'Home', route: '/', icon: 'home', options: { exact: true } },
    { label: 'Artists', route: '/artists', icon: 'people' },
    // { label: 'Albums', route: '/albums', icon: 'album' },
  ];
}
