import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Descriptivos } from './descriptivos';

describe('Descriptivos', () => {
  let component: Descriptivos;
  let fixture: ComponentFixture<Descriptivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Descriptivos],
    }).compileComponents();

    fixture = TestBed.createComponent(Descriptivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
