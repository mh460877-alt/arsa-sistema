import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Relevamiento } from './relevamiento';

describe('Relevamiento', () => {
  let component: Relevamiento;
  let fixture: ComponentFixture<Relevamiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Relevamiento],
    }).compileComponents();

    fixture = TestBed.createComponent(Relevamiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
