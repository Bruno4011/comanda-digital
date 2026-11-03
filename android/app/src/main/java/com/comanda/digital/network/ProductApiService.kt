package com.comanda.digital.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.HTTP

interface ProductApiService {
    @HTTP(method = "DELETE", path = "/api/produtos/lote", hasBody = true)
    suspend fun excluirProdutosEmMassa(@Body ids: List<Int>): Response<Unit>
}
