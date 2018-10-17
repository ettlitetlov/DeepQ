import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QAgentComponent } from './q-agent.component';

describe('QAgentComponent', () => {
  let component: QAgentComponent;
  let fixture: ComponentFixture<QAgentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QAgentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QAgentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
