import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selecionados: Set<number> = new Set();
  excluindoLote = false;

  // Pedidos ao vivo (aba Operações): seleção para exclusão em lote
  selOp: Set<number> = new Set();
  excluindoOp = false;
  opErro = '';

  // Tela "Excluir Pedidos" (exclusão em massa de qualquer pedido do banco)
  exPedidos: any[] = [];
  exFiltrados: any[] = [];
  exSelecionados: Set<number> = new Set();
  exCarregando = false;
  exExcluindo = false;
  exErro = '';
  exSucesso = '';
  exStatus = 'TODOS';
  exBusca = '';
  exDe = '';
  exAte = '';
  private exUltimo: number | null = null;

  // Usuários
  usuarios: any[] = [];
  novoUsuario: any = { nome: '', email: '', senha: '', role: 'GARCOM', ativo: true };
  editandoUsuario: any = null;
  usuarioErro = '';
  usuarioSucesso = '';
  usuarioCarregando = false;
  private rolesCriacao = ['GARCOM', 'COZINHA', 'COPA', 'PRATO_QUENTE', 'PRATO_FRIO'];

  private interval: any;

  constructor(private auth: AuthService, private api: ApiService) {}

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

  setTab(t: string) { this.tab = t; if (t === 'usuarios') this.loadUsuarios(); if (t === 'excluir') this.exCarregar(); }

  logout() { this.auth.logout(); }

  // Dashboard
  loadDashboard() {
    this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
    this.api.getRelatorioHoje().subscribe({ next: (r: any) => this.relatorio = r, error: () => {} });
    this.api.getComandasAbertas().subscribe({ next: (r: any[]) => this.comandasAbertas = r, error: () => {} });
    this.api.getComandasEmPreparo().subscribe({ next: (r: any[]) => this.comandasEmPreparo = r, error: () => {} });
    this.api.getComandasProntas().subscribe({ next: (r: any[]) => this.comandasProntas = r, error: () => {} });
    this.loadMesas();
  }

  loadUsuarios() {
    this.usuarioCarregando = true;
    this.api.getUsuarios().subscribe({
      next: u => { this.usuarios = u; this.usuarioCarregando = false; },
      error: () => this.usuarioCarregando = false
    });
  }

  salvarUsuario() {
    this.usuarioErro = '';
    this.usuarioSucesso = '';
    if (!this.novoUsuario.nome?.trim()) { this.usuarioErro = 'Nome é obrigatório.'; return; }
    if (!this.novoUsuario.email?.trim()) { this.usuarioErro = 'Email é obrigatório.'; return; }
    if (!this.editandoUsuario && !this.novoUsuario.senha?.trim()) { this.usuarioErro = 'Senha é obrigatória.'; return; }

    const obs = this.editandoUsuario
      ? this.api.atualizarUsuario(this.editandoUsuario.id, this.novoUsuario)
      : this.api.criarUsuario(this.novoUsuario);

    obs.subscribe({
      next: () => {
        const msg = this.editandoUsuario ? 'Usuário atualizado!' : 'Usuário criado!';
        this.loadUsuarios();
        this.novoUsuario = { nome: '', email: '', senha: '', role: 'GARCOM', ativo: true };
        this.editandoUsuario = null;
        this.usuarioSucesso = msg;
        setTimeout(() => this.usuarioSucesso = '', 3000);
      },
      error: (err) => { this.usuarioErro = err?.error?.erro || 'Erro ao salvar usuário.'; }
    });
  }

  editarUsuario(u: any) {
    this.editandoUsuario = u;
    this.novoUsuario = { nome: u.nome, email: u.email, senha: '', role: u.role, ativo: u.ativo };
    this.usuarioErro = '';
  }

  cancelarEdicaoUsuario() {
    this.editandoUsuario = null;
    this.novoUsuario = { nome: '', email: '', senha: '', role: 'GARCOM', ativo: true };
    this.usuarioErro = '';
  }

  deletarUsuario(u: any) {
    if (u.role === 'ADMIN') { this.usuarioErro = 'Não é possível excluir o administrador.'; return; }
    if (!confirm('Excluir usuário ' + u.nome + '?')) return;
    this.api.deletarUsuario(u.id).subscribe({
      next: () => { this.loadUsuarios(); this.usuarioSucesso = 'Usuário excluído.'; setTimeout(() => this.usuarioSucesso = '', 3000); },
      error: (err) => { this.usuarioErro = err?.error?.erro || 'Erro ao excluir.'; }
    });
  }

  toggleUsuario(u: any) {
    if (u.role === 'ADMIN') return;
    this.api.toggleUsuario(u.id).subscribe({ next: () => this.loadUsuarios(), error: () => {} });
  }

  get rolesDisponiveis(): string[] {
    return this.editandoUsuario?.role === 'ADMIN' ? ['ADMIN', ...this.rolesCriacao] : this.rolesCriacao;
  }

  /** Usuário usado nos pedidos de clientes/delivery: sem editar, desativar ou excluir. */
  ehUsuarioSistema(u: any): boolean {
    return (u?.email || '').toLowerCase() === 'cliente@comanda.com';
  }

  roleLabel(r: string) {
    const m: Record<string,string> = { ADMIN:'Administrador', GARCOM:'Garçom', COZINHA:'Cozinha', COPA:'Copa', PRATO_QUENTE:'Prato Quente', PRATO_FRIO:'Prato Frio', CLIENTE:'Cliente' };
    return m[r] || r;
  }

  loadMesas() {
    this.api.getMesas().subscribe({ next: (r: any[]) => this.mesas = r, error: () => {} });
  }

  finalizarComanda(id: number) {
    this.api.atualizarStatusComanda(id, 'FINALIZADA').subscribe({ next: () => this.loadDashboard(), error: () => {} });
  }

  toggleMesa(m: any) {
    const novoStatus = m.status === 'LIVRE' ? 'OCUPADA' : 'LIVRE';
    this.api.atualizarStatusMesa(m.id, novoStatus).subscribe({ next: () => this.loadMesas(), error: () => {} });
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
    this.api.getRelatorioPeriodo(this.finInicio, this.finFim).subscribe({
      next: (r: any) => {
        this.finRelatorio = r;
        this.finCarregando = false;
        this.maxProdQty = r.topProdutos?.[0]?.quantidade || 0;
        this.setGraficoDias(this.graficoDias);
      },
      error: () => { this.finCarregando = false; }
    });
  }

  setGraficoDias(dias: number) {
    this.graficoDias = dias;
    this.api.getFaturamentoDiario(dias).subscribe({
      next: (r: any[]) => {
        this.faturamentoDiario = r;
        this.maxFaturamento = r.reduce((a, b) => Math.max(a, b.faturamento), 0);
      },
      error: () => {}
    });
  }

  barHeight(val: number): number {
    return this.maxFaturamento > 0 ? Math.max(2, (val / this.maxFaturamento) * 100) : 0;
  }

  prodBarWidth(qty: number): number {
    return this.maxProdQty > 0 ? (qty / this.maxProdQty) * 100 : 0;
  }

  // Produtos
  loadProdutos() {
    this.api.getProdutos().subscribe({ next: (r: any[]) => this.produtos = r, error: () => {} });
    this.api.getCategorias().subscribe({ next: (r: any[]) => this.categorias = r, error: () => {} });
  }

  editarProduto(p: any) {
    this.editando = p;
    this.novoProduto = { nome: p.nome, descricao: p.descricao, preco: p.preco, categoriaId: p.categoria?.id ?? null, disponivel: p.disponivel, imagemUrl: p.imagemUrl || '' };
  }

  salvarProduto() {
    this.produtoErro = ''; this.produtoSucesso = '';
    const req = this.editando
      ? this.api.atualizarProduto(this.editando.id, this.novoProduto)
      : this.api.criarProduto(this.novoProduto);
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
    this.api.deletarProduto(id).subscribe({ next: () => this.loadProdutos(), error: () => {} });
  }

  // Histórico
  toggleSelecionado(id: number) {
    if (this.selecionados.has(id)) this.selecionados.delete(id);
    else this.selecionados.add(id);
  }

  get todosSelecionados(): boolean {
    return this.historico.length > 0 && this.selecionados.size === this.historico.length;
  }

  selecionarTodos() {
    if (this.todosSelecionados) {
      this.selecionados.clear();
    } else {
      this.historico.forEach(c => this.selecionados.add(c.id));
    }
  }

  excluirSelecionados() {
    if (this.selecionados.size === 0) return;
    if (!confirm(`Excluir ${this.selecionados.size} comanda(s) selecionada(s)? Esta ação não pode ser desfeita.`)) return;
    this.excluindoLote = true;
    const ids = Array.from(this.selecionados);
    this.api.deletarComandasEmLote(ids).subscribe({
      next: () => {
        this.selecionados.clear();
        this.excluindoLote = false;
        this.buscarHistorico();
      },
      error: () => { this.excluindoLote = false; this.historicoErro = 'Erro ao excluir comandas.'; }
    });
  }

  // ---- Tela "Excluir Pedidos" ----
  exCarregar() {
    this.exCarregando = true;
    this.exErro = '';
    this.api.getTodasComandas().subscribe({
      next: (r: any[]) => {
        this.exPedidos = r;
        const existentes = new Set(r.map((c: any) => c.id));
        this.exSelecionados.forEach(id => { if (!existentes.has(id)) this.exSelecionados.delete(id); });
        this.exAplicarFiltro();
        this.exCarregando = false;
      },
      error: () => { this.exErro = 'Erro ao carregar os pedidos.'; this.exCarregando = false; }
    });
  }

  private exSemAcento(s: string): string {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  exResumoItens(c: any): string {
    return (c.itens || []).map((i: any) => `${i.quantidade}× ${i.produto?.nome ?? 'item'}`).join(', ');
  }

  exAplicarFiltro() {
    const busca = this.exSemAcento(this.exBusca.trim());
    this.exFiltrados = this.exPedidos.filter((c: any) => {
      if (this.exStatus !== 'TODOS' && c.status !== this.exStatus) return false;
      const dia = (c.abertaEm || '').substring(0, 10);
      if (this.exDe && dia < this.exDe) return false;
      if (this.exAte && dia > this.exAte) return false;
      if (!busca) return true;
      const texto = this.exSemAcento(
        `#${c.id} ${c.mesa ? 'mesa ' + c.mesa.numero : 'balcao'} ${c.status} ${c.usuario?.nome ?? ''} ${c.observacoes ?? ''} ${this.exResumoItens(c)}`);
      return texto.includes(busca);
    });
    this.exUltimo = null;
  }

  /** Só vale o que está VISÍVEL na lista (filtro atual): o que foi marcado e saiu do filtro não é apagado. */
  get exSelecionadas(): any[] { return this.exFiltrados.filter(c => this.exSelecionados.has(c.id)); }
  get exTodosSelecionados(): boolean {
    return this.exFiltrados.length > 0 && this.exFiltrados.every(c => this.exSelecionados.has(c.id));
  }
  get exTotalSelecionado(): number { return this.exSelecionadas.reduce((s, c) => s + (c.total || 0), 0); }

  exSelecionarTodos() {
    if (this.exTodosSelecionados) this.exFiltrados.forEach(c => this.exSelecionados.delete(c.id));
    else this.exFiltrados.forEach(c => this.exSelecionados.add(c.id));
  }

  /** Clique no checkbox; com Shift marca/desmarca todos entre o último clicado e este. */
  exClique(ev: MouseEvent, id: number) {
    const ids = this.exFiltrados.map(c => c.id);
    const marcar = !this.exSelecionados.has(id);
    if (ev.shiftKey && this.exUltimo !== null && ids.includes(this.exUltimo)) {
      const a = ids.indexOf(this.exUltimo), b = ids.indexOf(id);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (marcar) this.exSelecionados.add(ids[i]); else this.exSelecionados.delete(ids[i]);
      }
    } else {
      if (marcar) this.exSelecionados.add(id); else this.exSelecionados.delete(id);
    }
    this.exUltimo = id;
  }

  exExcluir() {
    const sel = this.exSelecionadas;
    if (sel.length === 0 || this.exExcluindo) return;

    const rotulos: Record<string, string> = { ABERTA: 'aberta(s)', EM_PREPARO: 'em preparo', PRONTA: 'pronta(s)', FINALIZADA: 'finalizada(s)', CANCELADA: 'cancelada(s)' };
    const contagem: Record<string, number> = {};
    sel.forEach(c => { contagem[c.status] = (contagem[c.status] || 0) + 1; });
    const linhas = Object.keys(contagem).map(s => `  • ${contagem[s]} ${rotulos[s] || s}`).join('\n');
    const noFinanceiro = (contagem['PRONTA'] || 0) + (contagem['FINALIZADA'] || 0);
    const naoEntregues = (contagem['ABERTA'] || 0) + (contagem['EM_PREPARO'] || 0) + (contagem['PRONTA'] || 0);

    let msg = `Excluir ${sel.length} pedido(s) do banco de dados?\n\n${linhas}\n\nIsso NÃO pode ser desfeito.`;
    if (noFinanceiro > 0) msg += `\n⚠ ${noFinanceiro} deles contam no faturamento e vão sair do Financeiro.`;
    if (naoEntregues > 0) msg += `\n⚠ ${naoEntregues} ainda não foram entregues: somem da cozinha e liberam a mesa.`;
    if (!confirm(msg)) return;

    if (sel.length > 20) {
      const digitado = prompt(`Você vai excluir ${sel.length} pedidos.\nPara confirmar, digite EXCLUIR:`);
      if ((digitado || '').trim().toUpperCase() !== 'EXCLUIR') return;
    }

    this.exExcluindo = true;
    this.exErro = '';
    this.exSucesso = '';
    const ids = sel.map(c => c.id);
    this.api.deletarComandasEmLote(ids).subscribe({
      next: (r: any) => {
        const n = r?.excluidas ?? ids.length;
        this.exSelecionados.clear();
        this.exExcluindo = false;
        this.exSucesso = `${n} pedido(s) excluído(s).`;
        setTimeout(() => this.exSucesso = '', 6000);
        this.exCarregar();
        this.loadDashboard();
      },
      error: (err: any) => {
        this.exExcluindo = false;
        this.exErro = err?.error?.erro || 'Erro ao excluir os pedidos.';
        this.exCarregar();
      }
    });
  }

  // ---- Operações: exclusão em lote dos pedidos ao vivo ----
  get todosAoVivo(): any[] {
    return [...this.comandasAbertas, ...this.comandasEmPreparo, ...this.comandasProntas];
  }

  /** Só conta/apaga o que está VISÍVEL: se um pedido marcado sumiu da lista (ex.: foi finalizado), ele fica de fora. */
  get selOpIds(): number[] {
    const vivos = new Set(this.todosAoVivo.map(c => c.id));
    return Array.from(this.selOp).filter(id => vivos.has(id));
  }

  get todosOpSelecionados(): boolean {
    const todos = this.todosAoVivo;
    return todos.length > 0 && todos.every(c => this.selOp.has(c.id));
  }

  toggleSelOp(id: number) {
    if (this.selOp.has(id)) this.selOp.delete(id); else this.selOp.add(id);
  }

  selecionarTodosOp() {
    if (this.todosOpSelecionados) this.selOp.clear();
    else this.todosAoVivo.forEach(c => this.selOp.add(c.id));
  }

  excluirSelecionadosOp() {
    const ids = this.selOpIds;
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} pedido(s) em andamento?\n\nEles somem da cozinha/copa, as mesas são liberadas e isso NÃO pode ser desfeito.`)) return;
    this.excluindoOp = true;
    this.opErro = '';
    this.api.deletarComandasEmLote(ids).subscribe({
      next: () => { this.selOp.clear(); this.excluindoOp = false; this.loadDashboard(); },
      error: (err) => { this.excluindoOp = false; this.opErro = err?.error?.erro || 'Erro ao excluir pedidos.'; this.loadDashboard(); }
    });
  }

  excluirUma(id: number) {
    if (!confirm('Excluir esta comanda?')) return;
    this.api.deletarComanda(id).subscribe({
      next: () => {
        this.selecionados.delete(id);
        this.buscarHistorico();
      },
      error: () => { this.historicoErro = 'Erro ao excluir comanda.'; }
    });
  }

  buscarHistorico() {
    this.historicoCarregando = true; this.historicoErro = '';
    this.selecionados.clear();
    this.api.getHistorico(this.dataInicio, this.dataFim).subscribe({
      next: (r: any[]) => {
        this.historico = r;
        this.totalHistorico = r.reduce((a: number, c: any) => a + (c.total || 0), 0);
        this.historicoCanceladas = r.filter((c: any) => c.status === 'CANCELADA').length;
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
