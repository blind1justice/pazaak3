import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PhonkAudioPlayer } from '../../../features/phonk-audio-player/phonk-audio-player';

@Component({
  selector: 'app-navbar',
  imports: [
    NgOptimizedImage,
    RouterLink,
    PhonkAudioPlayer
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {

}
