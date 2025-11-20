import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service/auth-service';

@Component({
  selector: 'app-home-page',
  imports: [
    MatButton,
    RouterLink
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  onLogoutClick() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
