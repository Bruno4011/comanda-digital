import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { forkJoin } from 'rxjs';

const CATS_COPA = ['bebidas','bebida','sobremesas','sobremesa','doces','doce','drinks','drink','sucos','suco','cafe','cafes','cafeteria','vitaminas','vitamina','milkshake','sorvetes','sorvete','shakes','shake'];

@Component({ selector: 'app-copa', standalone: true, imports: [CommonModule], templateUrl: './copa.component.html' })
export class CopaComponent implements OnInit, OnDestroy {
  user: any; comandas: any[] = []; timer: any;
  ultimaAtualizacao = ''; novaComanda = false; qtdAnterior = 0;
  constructor(private auth: AuthService, private api: ApiService) { this.user = auth.getUser(); }
  ngOnInit() { this.loadComandas(); this.timer = setInterval(() => this.loadComandas(), 3000); }
  ngOnDestroy() { clearInterval(this.timer); }
  normalize(s: string) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
  itens(c: any): any[] {
    if (!c.itens) return [];
    return c.itens.filter((it: any) => { const cat = this.normalize(it.produto?.categoria?.nome || ''); return CATS_COPA.some(k => cat.includes(k)); });
  }
  temItens(c: any) { return this.itens(c).length > 0; }
  loadComandas() {
    forkJoin({ abertas: this.api.getComandasAbertas(), emPreparo: this.api.getComandasEmPreparo() }).subscribe({
      next: ({ abertas, emPreparo }) => {
        const todas = [...abertas, ...emPreparo].filter(c => this.temItens(c)).sort((a, b) => new Date(a.abertaEm).getTime() - new Date(b.abertaEm).getTime());
        if (todas.length > this.qtdAnterior && this.qtdAnterior > 0) { this.novaComanda = true; setTimeout(() => this.novaComanda = false, 4000); }
        this.qtdAnterior = todas.length; this.comandas = todas;
        this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
      }, error: () => {}
    });
  }
  avancar(c: any) { const next: Record<string,string> = { ABERTA: 'EM_PREPARO', EM_PREPARO: 'PRONTA' }; if (next[c.status]) this.api.atualizarStatusComanda(c.id, next[c.status]).subscribe(() => this.loadComandas()); }
  btnLabel(s: string) { return ({ ABERTA: '🥤 Iniciar Preparo', EM_PREPARO: '✅ Marcar Pronto' } as any)[s] || ''; }
  btnClass(s: string) { return ({ ABERTA: 'btn-primary', EM_PREPARO: 'btn-success' } as any)[s] || ''; }
  statusClass(s: string) { return ({ ABERTA: 'badge-orange', EM_PREPARO: 'badge-yellow', PRONTA: 'badge-blue' } as any)[s] || ''; }
  logout() { this.auth.logout(); }
  tempo(dt: string) { const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000); if (diff < 1) return 'agora'; if (diff === 1) return '1 min'; return diff + ' min'; }
  tempoClass(dt: string) { const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000); if (diff >= 15) return 'tempo-urgente'; if (diff >= 8) return 'tempo-alerta'; return 'tempo-ok'; }
}
