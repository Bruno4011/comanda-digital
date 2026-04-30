package com.comanda.controller;
import com.comanda.dto.ProdutoRequest;
import com.comanda.entity.*;
import com.comanda.service.ProdutoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class ProdutoController {
    private final ProdutoService produtoService;

    @GetMapping("/produtos/disponiveis")
    public List<Produto> disponiveis() { return produtoService.listarDisponiveis(); }

    @GetMapping("/categorias")
    public List<Categoria> categorias() { return produtoService.listarCategorias(); }

    @GetMapping("/admin/produtos")
    public List<Produto> todos(@AuthenticationPrincipal Usuario u) {
        return produtoService.listarTodos();
    }

    @PostMapping("/admin/produtos")
    public ResponseEntity<Produto> criar(@RequestBody ProdutoRequest req, @AuthenticationPrincipal Usuario u) {
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(produtoService.salvar(req));
    }

    @PutMapping("/admin/produtos/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @RequestBody ProdutoRequest req, @AuthenticationPrincipal Usuario u) {
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(produtoService.atualizar(id, req));
    }

    @DeleteMapping("/admin/produtos/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id, @AuthenticationPrincipal Usuario u) {
        if (u == null) return ResponseEntity.status(401).build();
        produtoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
