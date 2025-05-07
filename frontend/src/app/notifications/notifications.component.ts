import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  NotificationService,
  Notification,
} from '../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div
        *ngFor="let notification of notifications"
        class="notification p-4 rounded shadow-lg min-w-[300px] transition-all duration-300 ease-in-out"
        [ngClass]="{
          'bg-blue-100 border-l-4 border-blue-500':
            notification.type === 'info',
          'bg-green-100 border-l-4 border-green-500':
            notification.type === 'success',
          'bg-yellow-100 border-l-4 border-yellow-500':
            notification.type === 'warning',
          'bg-red-100 border-l-4 border-red-500': notification.type === 'error'
        }"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p
              class="text-sm"
              [ngClass]="{
                'text-blue-800': notification.type === 'info',
                'text-green-800': notification.type === 'success',
                'text-yellow-800': notification.type === 'warning',
                'text-red-800': notification.type === 'error'
              }"
            >
              {{ notification.message }}
            </p>
          </div>
          <button
            (click)="dismiss(notification.id)"
            class="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
    });
  }

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
