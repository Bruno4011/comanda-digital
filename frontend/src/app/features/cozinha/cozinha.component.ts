import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { forkJoin } from 'rxjs';

// Categorias que pertencem à COPA — cozinha exibe tudo EXCETO essas
const CATEGORIAS_COPA = ['bebidas', 'bebida', 'sobremesas', 'sobremesa', 'doces', 'drinks', 'sucos', 'suco', 'cafe', 'cafes', 'cafeteria'];

@Component({ selector: 'app-cozinha', standalone: true, imports: [CommonModule], templateUrl: './cozinha.component.html' })
export class CozinhaComponent implements OnInit, OnDestroy {
  user: any;
  comandas: any[] = [];
  timer: any;
  ultimaAtualizacao = '';
  novaComanda = false;
  qtdAnterior = 0;

  constructor(private auth: AuthService, private api: ApiService) {
    this.user = auth.getUser();
  }

  ngOnInit() {
    this.loadComandas();
    this.timer = setInterval(() => this.loadComandas(), 3000);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  // Itens da cozinha: exclui categorias da copa
  itensCozinha(comanda: any): any[] {
    if (!comanda.itens) return [];
    return comanda.itens.filter((it: any) => {
      const cat = (it.produto?.categoria?.nome || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return !CATEGORIAS_COPA.some(c => cat.includes(c));
    });
  }

  temItensCozinha(comanda: any): boolean {
    return this.itensCozinha(comanda).length > 0;
  }

  loadComandas() {
    forkJoin({
      abertas: this.api.getComandasAbertas(),
      emPreparo: this.api.getComandasEmPreparo()
    }).subscribe({
      next: ({ abertas, emPreparo }) => {
        const novas = [...abertas, ...emPreparo]
          .filter(c => this.temItensCozinha(c))
          .sort((a, b) => new Date(a.abertaEm).getTime() - new Date(b.abertaEm).getTime());

        if (novas.length > this.qtdAnterior && this.qtdAnterior > 0) {
          this.novaComanda = true;
          setTimeout(() => this.novaComanda = false, 3000);
        }
        this.qtdAnterior = novas.length;
        this.comandas = novas;
        this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
      },
      error: () => {}
    });
  }

  avancarStatus(c: any) {
    const next: Record<string, string> = { ABERTA: 'EM_PREPARO', EM_PREPARO: 'PRONTA' };
    if (next[c.status]) {
      this.api.atualizarStatusComanda(c.id, next[c.status]).subscribe(() => this.loadComandas());
    }
  }

  btnLabel(s: string) { return ({ ABERTA: 'Iniciar Preparo', EM_PREPARO: 'Marcar Pronta' } as any)[s] || ''; }
  btnClass(s: string) { return ({ ABERTA: 'btn-primary', EM_PREPARO: 'btn-success' } as any)[s] || ''; }
  statusClass(s: string) { return ({ ABERTA: 'badge-orange', EM_PREPARO: 'badge-yellow', PRONTA: 'badge-blue' } as any)[s] || ''; }
  logout() { this.auth.logout(); }

  tempo(dt: string) {
    const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff === 1) return '1 min';
    return diff + ' min';
  }

  tempoClass(dt: string) {
    const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (diff >= 15) return 'tempo-urgente';
    if (diff >= 8) return 'tempo-alerta';
    return 'tempo-ok';
  }
}
