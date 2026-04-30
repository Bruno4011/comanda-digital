import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({ selector: 'app-cliente', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './cliente.component.html' })
export class ClienteComponent implements OnInit {
  produtos: any[] = [];
  categorias: any[] = [];
  carrinho: any[] = [];
  catSelecionada: number | null = null;
  mesa = '';
  sucesso = false;
  enviando = false;

  // Modal
  modalProduto: any = null;
  modalQtd = 1;
  modalObs = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProdutosDisponiveis().subscribe(p => this.produtos = p);
    this.api.getCategorias().subscribe(c => this.categorias = c);
  }

  get filtrados() {
    return this.catSelecionada ? this.produtos.filter(p => p.categoria.id === this.catSelecionada) : this.produtos;
  }

  abrirModal(p: any) { this.modalProduto = p; this.modalQtd = 1; this.modalObs = ''; }
  fecharModal() { this.modalProduto = null; }

  confirmarModal() {
    if (!this.modalProduto) return;
    const ex = this.carrinho.find(i => i.produtoId === this.modalProduto.id);
    if (ex) {
      ex.quantidade += this.modalQtd;
    } else {
      this.carrinho.push({ produtoId: this.modalProduto.id, nome: this.modalProduto.nome, preco: this.modalProduto.preco, quantidade: this.modalQtd, observacoes: this.modalObs });
    }
    this.fecharModal();
  }

  incModalQtd() { this.modalQtd++; }
  decModalQtd() { if (this.modalQtd > 1) this.modalQtd--; }

  get total() { return this.carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0); }
  get qtdTotal() { return this.carrinho.reduce((s, i) => s + i.quantidade, 0); }

  enviar() {
    this.enviando = true;
    const data = {
      observacoes: this.mesa ? 'Mesa: ' + this.mesa : '',
      itens: this.carrinho.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade, observacoes: i.observacoes }))
    };
    this.api.abrirComanda(data).subscribe({
      next: () => { this.sucesso = true; this.carrinho = []; this.enviando = false; },
      error: () => this.enviando = false
    });
  }

  incQtd(it: any) { it.quantidade++; }
  decQtd(it: any) { it.quantidade--; }
  removerItem(it: any) { this.carrinho.splice(this.carrinho.indexOf(it), 1); }
  formatMoeda(v: number) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
}
