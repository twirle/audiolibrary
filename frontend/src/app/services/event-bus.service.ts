import { Injectable } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

export interface EventData {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private eventBus = new Subject<EventData>();

  emit(type: string, payload?: any): void {
    this.eventBus.next({ type, payload });
  }

  on(eventType: string): Observable<any> {
    return this.eventBus.pipe(
      filter((event) => event.type === eventType),
      map((event) => event.payload)
    );
  }
}
