import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioFileListComponent } from './audio-file-list.component';

describe('AudioFileListComponent', () => {
  let component: AudioFileListComponent;
  let fixture: ComponentFixture<AudioFileListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudioFileListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioFileListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
