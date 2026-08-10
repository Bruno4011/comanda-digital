import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  providers: [DatePipe]
})
export class AdminComponent implements OnInit, OnDestroy {
  tab = 'dashboard';
  user: any;
  timer: any;

  // Dashboard — operacional hoje
  relatorio: any = {};
  comandasAbertas: any[] = [];
  comandasEmPreparo: any[] = [];
  comandasProntas: any[] = [];
  ultimaAtualizacao = '';
  dashCarregando = false;

  // Financeiro — análise por período
  finRelatorio: any = null;
  finCarregando = false;
  faturamentoDiario: any[] = [];
  graficoDias = 14;
  finInicio = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
  finFim = new Date().toISOString().split('T')[0];

  // Histórico
  historico: any[] = [];
  historicoCarregando = false;
  historicoErro = '';
  dataInicio = new Date().toISOString().split('T')[0];
  dataFim = new Date().toISOString().split('T')[0];

  // Produtos
  produtos: any[] = [];
  categorias: any[] = [];
  novoProduto: any = { nome: '', descricao: '', preco: 0, categoriaId: null, disponivel: true, imagemUrl: '' };
  editando: any = null;
  produtoErro = '';
  produtoSucesso = '';

  // Mesas
  mesas: any[] = [];

  constructor(private auth: AuthService, private api: ApiService) {
    this.user = auth.getUser();
  }

  ngOnInit() {
    this.loadDashboard();
    // Timer criado UMA vez aqui, não dentro de loadDashboard
    this.timer = setInterval(() => {
      if (this.tab === 'dashboard') this.refreshDashboard();
    }, 10000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  loadDashboard() {
    this.dashCarregando = true;
    this.refreshDashboard();
  }

  refreshDashboard() {
    forkJoin({
      relatorio: this.api.getRelatorioHoje(),
      abertas: this.api.getComandasAbertas(),
      emPreparo: this.api.getComandasEmPreparo(),
      prontas: this.api.getComandasProntas()
    }).subscribe({
      next: ({ relatorio, abertas, emPreparo, prontas }) => {
        this.relatorio = relatorio;
        this.comandasAbertas = abertas;
        this.comandasEmPreparo = emPreparo;
        this.comandasProntas = prontas;
        this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
        this.dashCarregando = false;
      },
      error: () => this.dashCarregando = false
    });
  }

  setTab(t: string) {
    this.tab = t;
    if (t === 'dashboard') this.refreshDashboard();
    if (t === 'financeiro') this.loadFinanceiro();
    if (t === 'produtos') this.loadProdutos();
    if (t === 'mesas') this.loadMesas();
    if (t === 'historico') this.buscarHistorico();
  }

  // FINANCEIRO
  loadFinanceiro() {
    this.finCarregando = true;
    forkJoin({
      relatorio: this.api.getRelatorioPeriodo(this.finInicio, this.finFim),
      grafico: this.api.getFaturamentoDiario(this.graficoDias)
    }).subscribe({
      next: ({ relatorio, grafico }) => {
        this.finRelatorio = relatorio;
        this.faturamentoDiario = grafico;
        this.finCarregando = false;
      },
      error: () => this.finCarregando = false
    });
  }

  buscarFinanceiro() { this.loadFinanceiro(); }

  setGraficoDias(d: number) {
    this.graficoDias = d;
    this.api.getFaturamentoDiario(d).subscribe(g => this.faturamentoDiario = g);
  }

  // PRODUTOS
  loadProdutos() {
    this.api.getProdutos().subscribe(p => this.produtos = p);
    this.api.getCategorias().subscribe(c => this.categorias = c);
  }

  salvarProduto() {
    this.produtoErro = '';
    this.produtoSucesso = '';
    if (!this.novoProduto.nome?.trim()) { this.produtoErro = 'Nome é obrigatório.'; return; }
    if (!this.novoProduto.preco || this.novoProduto.preco <= 0) { this.produtoErro = 'Preço deve ser maior que zero.'; return; }
    if (!this.novoProduto.categoriaId) { this.produtoErro = 'Selecione uma categoria.'; return; }
    const obs = this.editando
      ? this.api.atualizarProduto(this.editando.id, this.novoProduto)
      : this.api.criarProduto(this.novoProduto);
    obs.subscribe({
      next: () => {
        this.loadProdutos();
        this.novoProduto = { nome: '', descricao: '', preco: 0, categoriaId: null, disponivel: true, imagemUrl: '' };
        this.editando = null;
        this.produtoSucesso = 'Produto salvo com sucesso!';
        setTimeout(() => this.produtoSucesso = '', 3000);
      },
      error: (err) => {
        const msg = err?.error?.erro || err?.error?.message || 'Erro desconhecido';
        this.produtoErro = 'Erro: ' + msg;
      }
    });
  }

  editarProduto(p: any) {
    this.editando = p;
    this.novoProduto = { nome: p.nome, descricao: p.descricao, preco: p.preco, categoriaId: p.categoria.id, disponivel: p.disponivel, imagemUrl: p.imagemUrl || '' };
  }

  deletarProduto(id: number) {
    if (confirm('Excluir produto?')) this.api.deletarProduto(id).subscribe(() => this.loadProdutos());
  }

  finalizarComanda(id: number) {
    this.api.atualizarStatusComanda(id, 'FINALIZADA').subscribe(() => this.refreshDashboard());
  }

  loadMesas() {
    this.api.getMesas().subscribe(m => this.mesas = m.sort((a: any, b: any) => a.numero - b.numero));
  }

  toggleMesa(m: any) {
    const novoStatus = m.status === 'LIVRE' ? 'OCUPADA' : 'LIVRE';
    this.api.atualizarStatusMesa(m.id, novoStatus).subscribe(() => this.loadMesas());
  }

  // HISTÓRICO
  buscarHistorico() {
    this.historicoCarregando = true;
    this.historicoErro = '';
    this.historico = [];
    this.api.getHistorico(this.dataInicio, this.dataFim).subscribe({
      next: h => { this.historico = h; this.historicoCarregando = false; if (!h.length) this.historicoErro = 'Nenhuma comanda encontrada.'; },
      error: () => { this.historicoCarregando = false; this.historicoErro = 'Erro ao buscar histórico.'; }
    });
  }

  // Helpers gráfico
  get maxFaturamento(): number {
    return Math.max(...this.faturamentoDiario.map(d => Number(d.faturamento)), 1);
  }
  barHeight(val: number): number {
    return Math.round((Number(val) / this.maxFaturamento) * 100);
  }
  get maxQtdProduto(): number {
    if (!this.finRelatorio?.topProdutos?.length) return 1;
    return Math.max(...this.finRelatorio.topProdutos.map((p: any) => Number(p.quantidade)));
  }
  prodBarWidth(q: number): number {
    return Math.round((q / this.maxQtdProduto) * 100);
  }

  // Helpers operacionais
  tempoAberta(dt: any): string {
    if (!dt) return '';
    const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return diff + 'min';
    return Math.floor(diff / 60) + 'h' + (diff % 60 > 0 ? (diff % 60) + 'min' : '');
  }
  tempoClass(dt: any): string {
    const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (diff >= 20) return 'tempo-urgente';
    if (diff >= 10) return 'tempo-alerta';
    return 'tempo-ok';
  }

  get totalHistorico(): number {
    return this.historico.filter(c => c.status === 'FINALIZADA').reduce((s, c) => s + Number(c.total), 0);
  }
  get historicoCanceladas(): number {
    return this.historico.filter(c => c.status === 'CANCELADA').length;
  }

  statusClass(s: string) {
    return ({ ABERTA: 'badge-orange', EM_PREPARO: 'badge-yellow', PRONTA: 'badge-blue', FINALIZADA: 'badge-green', CANCELADA: 'badge-red' } as any)[s] || '';
  }
  formatData(dt: any): string {
    if (!dt) return '-';
    try { return new Date(dt).toLocaleString('pt-BR'); } catch { return '-'; }
  }
  logout() { this.auth.logout(); }
  formatMoeda(v: any) { return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ','); }
  formatPct(v: any) { return Number(v || 0).toFixed(1) + '%'; }
}
