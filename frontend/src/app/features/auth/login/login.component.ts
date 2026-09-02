import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login', standalone: true, imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private static serverConfirmedAwake = false;

  email = ''; senha = ''; erro = ''; loading = false;
  serverReady = LoginComponent.serverConfirmedAwake;
  serverChecking = !LoginComponent.serverConfirmedAwake;
  checkAttempt = 0;
  checkMax = 20;

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {
    if (this.auth.isLoggedIn()) this.redirect(this.auth.getUser()!.role);
  }

  ngOnInit() {
    if (!LoginComponent.serverConfirmedAwake) this.checkServer();
  }

  checkServer() {
    this.http.get(`${environment.apiUrl}/categorias`).subscribe({
      next: () => { this.serverReady = true; this.serverChecking = false; LoginComponent.serverConfirmedAwake = true; },
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
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) this.erro = 'Email ou senha inválidos.';
        else if (err.status === 0) this.erro = 'Não foi possível conectar ao servidor (verifique CORS_ORIGIN no Render ou sua internet).';
        else this.erro = `Erro ao entrar (código ${err.status}). Tente novamente.`;
      }
    });
  }

  redirect(role: string) {
    const map: Record<string, string> = { ADMIN: '/admin', GARCOM: '/garcom', COZINHA: '/cozinha', COPA: '/copa', PRATO_QUENTE: '/prato-quente', PRATO_FRIO: '/prato-frio', CLIENTE: '/cliente' };
    this.router.navigate([map[role] || '/login']);
  }
}
