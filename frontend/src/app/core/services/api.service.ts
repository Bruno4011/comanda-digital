import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}
  // Produtos
  getProdutosDisponiveis() { return this.http.get<any[]>(`${this.base}/produtos/disponiveis`); }
  getProdutos() { return this.http.get<any[]>(`${this.base}/admin/produtos`); }
  getCategorias() { return this.http.get<any[]>(`${this.base}/categorias`); }
  criarProduto(p: any) { return this.http.post<any>(`${this.base}/admin/produtos`, p); }
  atualizarProduto(id: number, p: any) { return this.http.put<any>(`${this.base}/admin/produtos/${id}`, p); }
  deletarProduto(id: number) { return this.http.delete(`${this.base}/admin/produtos/${id}`); }
  // Mesas
  getMesas() { return this.http.get<any[]>(`${this.base}/mesas`); }
  getMesasLivres() { return this.http.get<any[]>(`${this.base}/mesas/livres`); }
  atualizarStatusMesa(id: number, status: string) { return this.http.patch<any>(`${this.base}/mesas/${id}/status`, { status }); }
  // Comandas
  abrirComanda(data: any) { return this.http.post<any>(`${this.base}/comandas`, data); }
  getComandasAbertas() { return this.http.get<any[]>(`${this.base}/comandas/abertas`); }
  getComandasEmPreparo() { return this.http.get<any[]>(`${this.base}/comandas/em-preparo`); }
  getComandasProntas() { return this.http.get<any[]>(`${this.base}/comandas/prontas`); }
  getTodasComandas() { return this.http.get<any[]>(`${this.base}/comandas`); }
  atualizarStatusComanda(id: number, status: string) { return this.http.patch<any>(`${this.base}/comandas/${id}/status`, { status }); }
  adicionarItem(comandaId: number, item: any) { return this.http.post<any>(`${this.base}/comandas/${comandaId}/itens`, item); }
  getItensPendentes() { return this.http.get<any[]>(`${this.base}/comandas/itens/pendentes`); }
  atualizarStatusItem(itemId: number, status: string) { return this.http.patch<any>(`${this.base}/comandas/itens/${itemId}/status`, { status }); }
  // Relatórios
  getRelatorioHoje() { return this.http.get<any>(`${this.base}/relatorios/hoje`); }
  getHistorico(dataInicio: string, dataFim: string) { return this.http.get<any[]>(`${this.base}/relatorios/historico`, { params: { dataInicio, dataFim } }); }
  getRelatorioPeriodo(dataInicio: string, dataFim: string) { return this.http.get<any>(`${this.base}/relatorios/periodo`, { params: { dataInicio, dataFim } }); }
  getFaturamentoDiario(dias: number = 7) { return this.http.get<any[]>(`${this.base}/relatorios/faturamento-diario`, { params: { dias: dias.toString() } }); }
}