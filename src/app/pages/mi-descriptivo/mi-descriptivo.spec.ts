import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiDescriptivo } from './mi-descriptivo';

describe('MiDescriptivo', () => {
  let component: MiDescriptivo;
  let fixture: ComponentFixture<MiDescriptivo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiDescriptivo],
    }).compileComponents();

    fixture = TestBed.createComponent(MiDescriptivo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
