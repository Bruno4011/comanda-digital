package com.comanda.digital.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.comanda.digital.ui.viewmodels.ProductViewModel

@Composable
fun ProductListScreen(viewModel: ProductViewModel = viewModel()) {
    var produtosSelecionados by remember { mutableStateOf(setOf<Int>()) }
    var mostrarDialogo by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            if (produtosSelecionados.isNotEmpty()) {
                ExtendedFloatingActionButton(
                    onClick = { mostrarDialogo = true },
                    icon = { Icon(Icons.Default.Delete, contentDescription = "Excluir") },
                    text = { Text("Excluir ${produtosSelecionados.size}") },
                    containerColor = MaterialTheme.colorScheme.errorContainer,
                    contentColor = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            Text("Lista de Produtos da Comanda Digital")
            // A lista de itens ficaria aqui...
        }

        if (mostrarDialogo) {
            AlertDialog(
                onDismissRequest = { mostrarDialogo = false },
                title = { Text("Confirmar Exclusão") },
                text = { Text("Tem certeza que deseja excluir ${produtosSelecionados.size} item(s)?") },
                confirmButton = {
                    TextButton(onClick = {
                        viewModel.excluirProdutosEmMassa(produtosSelecionados.toList())
                        produtosSelecionados = emptySet()
                        mostrarDialogo = false
                    }) {
                        Text("Excluir", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { mostrarDialogo = false }) {
                        Text("Cancelar")
                    }
                }
            )
        }
    }
}
