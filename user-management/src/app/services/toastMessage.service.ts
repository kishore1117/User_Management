import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messageSubject = new BehaviorSubject<ToastMessage | null>(null);
  message$: Observable<ToastMessage | null> = this.messageSubject.asObservable();

  show(text: string, type: 'success' | 'error') {
    this.messageSubject.next({ text, type });
    // Auto hide after 2.5 seconds
    setTimeout(() => {
      this.messageSubject.next(null);
    }, 2500);
  }

  clear() {
    this.messageSubject.next(null);
  }
}