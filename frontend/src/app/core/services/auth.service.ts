import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
export interface UserInfo { id: number; nome: string; email: string; role: string; token: string; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:8080/api/auth';
  constructor(private http: HttpClient, private router: Router) {}
  login(email: string, senha: string) {
    return this.http.post<any>(`${this.api}/login`, { email, senha }).pipe(
      tap(r => localStorage.setItem('user', JSON.stringify(r)))
    );
  }
  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
  isLoggedIn() { return !!localStorage.getItem('user'); }
  getUser(): UserInfo | null { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
  getToken(): string | null { return this.getUser()?.token ?? null; }
}