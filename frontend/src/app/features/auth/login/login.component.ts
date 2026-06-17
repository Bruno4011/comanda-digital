import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login', standalone: true, imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  email = ''; senha = ''; erro = ''; loading = false;
  serverReady = false;
  serverChecking = true;
  checkAttempt = 0;
  checkMax = 20;

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {
    if (this.auth.isLoggedIn()) this.redirect(this.auth.getUser()!.role);
  }

  ngOnInit() { this.checkServer(); }

  checkServer() {
    this.http.get(`${environment.apiUrl}/categorias`).subscribe({
      next: () => { this.serverReady = true; this.serverChecking = false; },
      error: () => {
        this.checkAttempt++;
        if (this.checkAttempt < this.checkMax) setTimeout(() => this.checkServer(), 3000);
        else { this.serverReady = true; this.serverChecking = false; }
      }
    });
  }

  get progresso(): number { return Math.min(100, Math.round((this.checkAttempt / this.checkMax) * 100)); }

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
