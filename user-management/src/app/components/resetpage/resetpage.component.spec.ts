import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetpageComponent } from './resetpage.component';

describe('ResetpageComponent', () => {
  let component: ResetpageComponent;
  let fixture: ComponentFixture<ResetpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetpageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
