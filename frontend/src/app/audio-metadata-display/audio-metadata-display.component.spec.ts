import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioMetadataDisplayComponent } from './audio-metadata-display.component';

describe('AudioMetadataDisplayComponent', () => {
  let component: AudioMetadataDisplayComponent;
  let fixture: ComponentFixture<AudioMetadataDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudioMetadataDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudioMetadataDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
