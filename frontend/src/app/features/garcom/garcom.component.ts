import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({ selector: 'app-garcom', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './garcom.component.html' })
export class GarcomComponent implements OnInit {
  tab = 'novaComanda';
  user: any;
  mesas: any[] = [];
  produtos: any[] = [];
  categorias: any[] = [];
  comandas: any[] = [];
  prontas: any[] = [];
  pedido: any = { mesaId: null, observacoes: '', itens: [] };
  catSelecionada: number | null = null;
  sucesso = '';
  erro = '';

  constructor(private auth: AuthService, private api: ApiService) { this.user = auth.getUser(); }

  ngOnInit() {
    this.api.getMesas().subscribe(m => this.mesas = m);
    this.api.getProdutosDisponiveis().subscribe(p => this.produtos = p);
    this.api.getCategorias().subscribe(c => this.categorias = c);
  }

  get produtosFiltrados() {
    return this.catSelecionada ? this.produtos.filter(p => p.categoria.id === this.catSelecionada) : this.produtos;
  }

  addItem(p: any) {
    const ex = this.pedido.itens.find((i: any) => i.produtoId === p.id);
    if (ex) ex.quantidade++;
    else this.pedido.itens.push({ produtoId: p.id, nome: p.nome, preco: p.preco, quantidade: 1, observacoes: '' });
  }

  removeItem(i: number) { this.pedido.itens.splice(i, 1); }
  incQtd(it: any) { it.quantidade++; }
  decQtd(it: any) { it.quantidade--; }

  get total() { return this.pedido.itens.reduce((s: number, i: any) => s + i.preco * i.quantidade, 0); }

  enviarComanda() {
    const data = {
      mesaId: this.pedido.mesaId || null,
      observacoes: this.pedido.observacoes,
      itens: this.pedido.itens.map((i: any) => ({ produtoId: i.produtoId, quantidade: i.quantidade, observacoes: i.observacoes }))
    };
    this.api.abrirComanda(data).subscribe({
      next: () => { this.sucesso = 'Comanda aberta!'; this.pedido = { mesaId: null, observacoes: '', itens: [] }; setTimeout(() => this.sucesso = '', 3000); },
      error: (err) => {
        const msg = err?.error?.erro || err?.error?.message || 'Erro ao abrir comanda.';
        this.erro = msg;
        setTimeout(() => this.erro = '', 5000);
      }
    });
  }

  loadComandas() {
    this.api.getComandasAbertas().subscribe(c => this.comandas = c);
    this.api.getComandasProntas().subscribe(p => this.prontas = p);
  }

  setTab(t: string) { this.tab = t; if (t === 'comandas') this.loadComandas(); }
  entregar(id: number) { this.api.atualizarStatusComanda(id, 'FINALIZADA').subscribe(() => this.loadComandas()); }
  fechar(id: number) { this.api.atualizarStatusComanda(id, 'FINALIZADA').subscribe(() => this.loadComandas()); }
  statusClass(s: string) { return ({ ABERTA: 'badge-orange', EM_PREPARO: 'badge-yellow', PRONTA: 'badge-blue', FINALIZADA: 'badge-green', CANCELADA: 'badge-red' } as any)[s] || ''; }
  logout() { this.auth.logout(); }
  formatMoeda(v: number) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
}
