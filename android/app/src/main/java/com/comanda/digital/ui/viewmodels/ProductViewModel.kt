package com.comanda.digital.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.comanda.digital.network.ProductApiService

class ProductViewModel(private val apiService: ProductApiService) : ViewModel() {

    fun excluirProdutosEmMassa(ids: List<Int>) {
        viewModelScope.launch {
            try {
                apiService.excluirProdutosEmMassa(ids)
                carregarProdutos()
            } catch (e: Exception) {
                // Tratamento de erro
            }
        }
    }

    private fun carregarProdutos() {
        // Implementar recarregamento
    }
}
