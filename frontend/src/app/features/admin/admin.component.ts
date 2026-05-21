import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit, OnDestroy {
  user = this.auth.getUser();
  tab = 'dashboard';
  ultimaAtualizacao = '';

  // Dashboard
  relatorio: any = {};
  comandasAbertas: any[] = [];
  comandasEmPreparo: any[] = [];
  comandasProntas: any[] = [];
  mesas: any[] = [];

  // Financeiro
  finInicio = '';
  finFim = '';
  finCarregando = false;
  finRelatorio: any = null;
  faturamentoDiario: any[] = [];
  graficoDias = 7;
  private maxFaturamento = 0;
  private maxProdQty = 0;

  // Produtos
  produtos: any[] = [];
  categorias: any[] = [];
  editando: any = null;
  novoProduto: any = { nome: '', descricao: '', preco: 0, categoriaId: null, disponivel: true, imagemUrl: '' };
  produtoErro = '';
  produtoSucesso = '';

  // Histórico
  dataInicio = '';
  dataFim = '';
  historico: any[] = [];
  historicoCarregando = false;
  historicoErro = '';
  totalHistorico = 0;
  historicoCanceladas = 0;

  private interval: any;

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    const hoje = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    this.finInicio = fmt(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    this.finFim = fmt(hoje);
    this.dataInicio = fmt(new Date(hoje.getTime() - 7 * 86400000));
    this.dataFim = fmt(hoje);
    this.loadDashboard();
    this.loadProdutos();
    this.loadMesas();
    this.interval = setInterval(() => this.loadDashboard(), 30000);
  }

  ngOnDestroy() { clearInterval(this.interval); }

  setTab(t: string) { this.tab = t; }

  logout() { this.auth.logout(); }

  // Dashboard
  loadDashboard() {
    this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
    this.api.get<any>('/relatorio/hoje').subscribe({ next: r => this.relatorio = r, error: () => {} });
    this.api.get<any[]>('/comandas/abertas').subscribe({ next: r => {
      this.comandasAbertas = r.filter((c: any) => c.status === 'ABERTA');
      this.comandasEmPreparo = r.filter((c: any) => c.status === 'EM_PREPARO');
      this.comandasProntas = r.filter((c: any) => c.status === 'PRONTA');
    }, error: () => {} });
    this.loadMesas();
  }

  loadMesas() {
    this.api.get<any[]>('/mesas').subscribe({ next: r => this.mesas = r, error: () => {} });
  }

  finalizarComanda(id: number) {
    this.api.put(`/comandas/${id}/fechar`, {}).subscribe({ next: () => this.loadDashboard(), error: () => {} });
  }

  toggleMesa(m: any) {
    const novoStatus = m.status === 'LIVRE' ? 'OCUPADA' : 'LIVRE';
    this.api.put(`/mesas/${m.id}`, { ...m, status: novoStatus }).subscribe({ next: () => this.loadMesas(), error: () => {} });
  }

  tempoAberta(data: string): string {
    if (!data) return '';
    const diff = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h${diff % 60}min`;
  }

  tempoClass(data: string): string {
    if (!data) return '';
    const diff = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
    if (diff > 30) return 'ops-tempo tempo-urgente';
    if (diff > 15) return 'ops-tempo tempo-alerta';
    return 'ops-tempo tempo-ok';
  }

  // Financeiro
  buscarFinanceiro() {
    this.finCarregando = true;
    this.finRelatorio = null;
    this.api.get<any>(`/relatorio/periodo?inicio=${this.finInicio}&fim=${this.finFim}`).subscribe({
      next: r => {
        this.finRelatorio = r;
        this.finCarregando = false;
        this.maxFaturamento = r.faturamentoDiario?.reduce((a: number, b: any) => Math.max(a, b.faturamento), 0) || 0;
        this.maxProdQty = r.topProdutos?.[0]?.quantidade || 0;
        this.setGraficoDias(this.graficoDias);
      },
      error: () => { this.finCarregando = false; }
    });
  }

  setGraficoDias(dias: number) {
    this.graficoDias = dias;
    const all: any[] = this.finRelatorio?.faturamentoDiario || [];
    this.faturamentoDiario = all.slice(-dias);
    this.maxFaturamento = this.faturamentoDiario.reduce((a, b) => Math.max(a, b.faturamento), 0);
  }

  barHeight(val: number): number {
    return this.maxFaturamento > 0 ? Math.max(2, (val / this.maxFaturamento) * 100) : 0;
  }

  prodBarWidth(qty: number): number {
    return this.maxProdQty > 0 ? (qty / this.maxProdQty) * 100 : 0;
  }

  // Produtos
  loadProdutos() {
    this.api.get<any[]>('/produtos').subscribe({ next: r => this.produtos = r, error: () => {} });
    this.api.get<any[]>('/categorias').subscribe({ next: r => this.categorias = r, error: () => {} });
  }

  editarProduto(p: any) {
    this.editando = p;
    this.novoProduto = { nome: p.nome, descricao: p.descricao, preco: p.preco, categoriaId: p.categoria?.id ?? null, disponivel: p.disponivel, imagemUrl: p.imagemUrl || '' };
  }

  salvarProduto() {
    this.produtoErro = ''; this.produtoSucesso = '';
    const req = this.editando
      ? this.api.put(`/produtos/${this.editando.id}`, this.novoProduto)
      : this.api.post('/produtos', this.novoProduto);
    req.subscribe({
      next: () => {
        this.produtoSucesso = this.editando ? 'Produto atualizado!' : 'Produto criado!';
        this.editando = null;
        this.novoProduto = { nome: '', descricao: '', preco: 0, categoriaId: null, disponivel: true, imagemUrl: '' };
        this.loadProdutos();
      },
      error: () => { this.produtoErro = 'Erro ao salvar produto.'; }
    });
  }

  deletarProduto(id: number) {
    if (!confirm('Deletar produto?')) return;
    this.api.delete(`/produtos/${id}`).subscribe({ next: () => this.loadProdutos(), error: () => {} });
  }

  // Histórico
  buscarHistorico() {
    this.historicoCarregando = true; this.historicoErro = '';
    this.api.get<any[]>(`/comandas/historico?inicio=${this.dataInicio}&fim=${this.dataFim}`).subscribe({
      next: r => {
        this.historico = r;
        this.totalHistorico = r.reduce((a, c) => a + (c.total || 0), 0);
        this.historicoCanceladas = r.filter(c => c.status === 'CANCELADA').length;
        this.historicoCarregando = false;
      },
      error: () => { this.historicoErro = 'Erro ao buscar histórico.'; this.historicoCarregando = false; }
    });
  }

  // Formatadores
  formatMoeda(v: number): string {
    return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatData(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR');
  }

  formatPct(v: number): string {
    return `${(v || 0).toFixed(1)}%`;
  }

  statusClass(s: string): string {
    const m: Record<string, string> = { FINALIZADA: 'badge-green', CANCELADA: 'badge-red', ABERTA: 'badge-yellow', EM_PREPARO: 'badge-yellow' };
    return m[s] || 'badge-yellow';
  }
}
