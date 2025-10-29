import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toastMessage.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="toastService.message$ | async as message"
         [@fadeInOut]
         class="toast-container"
         [ngClass]="message.type">
      {{ message.text }}
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      left: 50%;           /* Center horizontally */
      transform: translateX(-50%); /* Adjust for center alignment */
      padding: 15px 20px;
      border-radius: 4px;
      color: white;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      min-width: 300px;    /* Increased for better visibility */
      text-align: center;
    }
    .success {
      background-color: #28a745;
    }
    .error {
      background-color: #dc3545;
    }
  `],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ 
        opacity: 0,
        transform: 'translate(-50%, -100%)' /* Maintain horizontal center while sliding */
      })),
      state('*', style({ 
        opacity: 1,
        transform: 'translate(-50%, 0)' /* Maintain horizontal center at final position */
      })),
      transition('void <=> *', animate('300ms ease-out')),
    ])
  ]
})
export class ToastComponent implements OnInit {
  constructor(public toastService: ToastService) {}
  ngOnInit() {}
}