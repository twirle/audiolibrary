import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audio-metadata-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-metadata-display.component.html',
  styleUrls: ['./audio-metadata-display.component.css'],
})
export class AudioMetadataDisplayComponent {
  @Input() audioMetadata: any;

  formatDuration(durationInSeconds: number): string {
    if (!durationInSeconds) {
      return 'N/A';
    }
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
