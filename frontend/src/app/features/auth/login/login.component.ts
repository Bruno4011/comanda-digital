import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login', standalone: true, imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = ''; senha = ''; erro = ''; loading = false;
  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.redirect(this.auth.getUser()!.role);
  }
  login() {
    this.erro = ''; this.loading = true;
    this.auth.login(this.email, this.senha).subscribe({
      next: (u) => { this.loading = false; this.redirect(u.role); },
      error: () => { this.loading = false; this.erro = 'Email ou senha inválidos.'; }
    });
  }
  redirect(role: string) {
    const map: Record<string, string> = { ADMIN: '/admin', GARCOM: '/garcom', COZINHA: '/cozinha', CLIENTE: '/cliente' };
    this.router.navigate([map[role] || '/login']);
  }
}
