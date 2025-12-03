import { Component, effect, ElementRef, signal, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { TrackModel } from './track-model';

@Component({
  selector: 'app-phonk-audio-player',
  imports: [
    MatIcon,
    MatSlider,
    FormsModule,
    MatIconButton,
    MatSliderThumb,
  ],
  templateUrl: './phonk-audio-player.html',
  styleUrl: './phonk-audio-player.scss',
})
export class PhonkAudioPlayer {
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  playlist: TrackModel[] = [
    {
      url: '/assets/music/zxcursed-METAMORPHOSIS_3.mp3',
      title: 'METAMORPHOSIS 3',
      artist: 'zxcursed',
      cover: '/assets/covers/zxcursed-METAMORPHOSIS_3.jpg'
    },
    {
      url: '/assets/music/INTERWORLD-METAMORPhOSIS(SPEED UP).mp3',
      title: 'METAMORPhOSIS (SPEED UP)',
      artist: 'INTERWORLD',
      cover: '/assets/covers/Metamorphosis_-_Interworld.jpg'
    },
    {
      url: '/assets/music/MoonDeity-NEON_BLADE.mp3',
      title: 'NEON BLADE',
      artist: 'MoonDeity',
      cover: '/assets/covers/MoonDeity-NEON_BLADE.jpg'
    },
    {
      url: '/assets/music/INTERWORLD-RAPTURE.mp3',
      title: 'RAPTURE',
      artist: 'INTERWORLD',
      cover: '/assets/covers/INTERWORLD-RAPTURE.jpg'
    },
    // {
    //   url: '/assets/music/Shaman - Я Русский.mp3',
    //   title: 'Я русский',
    //   artist: 'Shaman',
    //   cover: '/assets/covers/zzz.png'
    // },
  ];

  currentTrackIndex = signal(0);
  currentTrack = signal(this.playlist[0]);
  isPlaying = signal(false);
  volume = signal(50);
  isMuted = signal(false);

  currentTime = signal(0);
  duration = signal(0);
  progress = signal(0);

  hasPrevious = signal(false);
  hasNext = signal(false);
  currentVolumeIcon = signal('volume_up');

  constructor() {
    effect(() => {
      this.hasPrevious.set(this.currentTrackIndex() > 0);
      this.hasNext.set(this.currentTrackIndex() < this.playlist.length - 1);
      this.currentTrack.set(this.playlist[this.currentTrackIndex()]);
      this.resetProgress();
    });

    effect(() => {
      const vol = this.volume();
      if (this.isMuted()) {
        this.currentVolumeIcon.set('volume_off');
      } else if (vol === 0) {
        this.currentVolumeIcon.set('volume_mute');
      } else if (vol > 50) {
        this.currentVolumeIcon.set('volume_up');
      } else {
        this.currentVolumeIcon.set('volume_down');
      }
    });

    effect(() => {
      if (this.audioElement?.nativeElement) {
        this.audioElement.nativeElement.volume = this.volume() / 100;
      }
    });
  }

  togglePlay() {
    if (!this.audioElement?.nativeElement) return;

    const audio = this.audioElement.nativeElement;
    if (this.isPlaying()) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Play error:', err));
    }
    this.isPlaying.set(!this.isPlaying());
  }

  seek(value: number) {
    if (!this.audioElement?.nativeElement) return;
    const audio = this.audioElement.nativeElement;
    audio.currentTime = (value / 100) * this.duration();
  }

  onTimeUpdate() {
    if (!this.audioElement?.nativeElement) return;
    const audio = this.audioElement.nativeElement;
    this.currentTime.set(audio.currentTime);
    this.duration.set(audio.duration || 0);
    this.progress.set(this.duration() > 0 ? (audio.currentTime / this.duration()) * 100 : 0);
  }

  private resetProgress() {
    this.currentTime.set(0);
    this.duration.set(0);
    this.progress.set(0);
  }

  next() {
    if (this.hasNext()) {
      this.currentTrackIndex.update(i => i + 1);
      this.resetAndPlay();
    }
  }

  previous() {
    if (this.hasPrevious()) {
      this.currentTrackIndex.update(i => i - 1);
      this.resetAndPlay();
    }
  }

  private resetAndPlay() {
    if (!this.audioElement?.nativeElement) return;
    const audio = this.audioElement.nativeElement;
    audio.load();
    audio.pause();
    this.isPlaying.set(false);
    this.resetProgress();
  }

  setVolume() {
    if (!this.audioElement?.nativeElement) return;
    const audio = this.audioElement.nativeElement;
    audio.volume = this.volume() / 100;
    this.isMuted.set(false);
  }

  toggleMute() {
    if (!this.audioElement?.nativeElement) return;
    const audio = this.audioElement.nativeElement;
    this.isMuted.update(m => !m);
    audio.muted = this.isMuted();
  }

  onEnded() {
    this.next();
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
