import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  id: number;
  autoClose?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private idCounter = 0;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  show(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    autoClose = true
  ): number {
    const id = this.idCounter++;
    const notification = { id, type, message, autoClose };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    if (autoClose) {
      setTimeout(() => this.dismiss(id), 5000);
    }

    return id;
  }

  dismiss(id: number): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter((notification) => notification.id !== id)
    );
  }
}
