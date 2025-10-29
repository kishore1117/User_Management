import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToatMessageComponent } from './toat-message.component';

describe('ToatMessageComponent', () => {
  let component: ToatMessageComponent;
  let fixture: ComponentFixture<ToatMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToatMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToatMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
