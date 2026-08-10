import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery.component.html'
})
export class DeliveryComponent implements OnInit {
  produtos: any[] = [];
  categorias: any[] = [];
  carrinho: any[] = [];
  catSelecionada: number | null = null;
  busca = '';

  // Etapas: 'menu' | 'endereco' | 'sucesso'
  etapa: 'menu' | 'endereco' | 'sucesso' = 'menu';
  enviando = false;

  endereco = {
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    referencia: '',
    telefone: '',
    nome: '',
    pagamento: 'dinheiro',
    troco: ''
  };

  taxaEntrega = 5.00;
  tempoEstimado = '30-45 min';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProdutosDisponiveis().subscribe(p => this.produtos = p);
    this.api.getCategorias().subscribe(c => this.categorias = c);
  }

  get filtrados() {
    let lista = this.catSelecionada
      ? this.produtos.filter(p => p.categoria.id === this.catSelecionada)
      : this.produtos;
    if (this.busca.trim()) {
      const b = this.busca.toLowerCase();
      lista = lista.filter(p => p.nome.toLowerCase().includes(b) || (p.descricao || '').toLowerCase().includes(b));
    }
    return lista;
  }

  addCarrinho(p: any) {
    const ex = this.carrinho.find(i => i.produtoId === p.id);
    if (ex) ex.quantidade++;
    else this.carrinho.push({ produtoId: p.id, nome: p.nome, preco: p.preco, quantidade: 1, imagemUrl: p.imagemUrl });
  }

  incQtd(it: any) { it.quantidade++; }
  decQtd(it: any) { it.quantidade--; }
  removerItem(it: any) { this.carrinho.splice(this.carrinho.indexOf(it), 1); }

  get subtotal() { return this.carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0); }
  get total() { return this.subtotal + this.taxaEntrega; }
  get qtdItens() { return this.carrinho.reduce((s, i) => s + i.quantidade, 0); }

  irParaEndereco() {
    if (this.carrinho.length === 0) return;
    this.etapa = 'endereco';
    window.scrollTo(0, 0);
  }

  voltarMenu() { this.etapa = 'menu'; }

  enderecoValido() {
    return this.endereco.nome && this.endereco.telefone &&
           this.endereco.rua && this.endereco.numero && this.endereco.bairro;
  }

  enviar() {
    if (!this.enderecoValido()) return;
    this.enviando = true;
    const endFormatado = `DELIVERY — ${this.endereco.nome} | Tel: ${this.endereco.telefone} | ` +
      `${this.endereco.rua}, ${this.endereco.numero}${this.endereco.complemento ? ' ' + this.endereco.complemento : ''}, ` +
      `${this.endereco.bairro}, ${this.endereco.cidade}` +
      (this.endereco.referencia ? ` | Ref: ${this.endereco.referencia}` : '') +
      ` | Pagamento: ${this.endereco.pagamento}` +
      (this.endereco.pagamento === 'dinheiro' && this.endereco.troco ? ` (troco p/ R$ ${this.endereco.troco})` : '');

    const data = {
      observacoes: endFormatado,
      itens: this.carrinho.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade }))
    };

    this.api.abrirComanda(data).subscribe({
      next: () => { this.etapa = 'sucesso'; this.enviando = false; },
      error: () => this.enviando = false
    });
  }

  novoPedido() {
    this.carrinho = [];
    this.etapa = 'menu';
    this.endereco = { rua:'', numero:'', complemento:'', bairro:'', cidade:'', referencia:'', telefone:'', nome:'', pagamento:'dinheiro', troco:'' };
  }

  formatMoeda(v: number) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
}