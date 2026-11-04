package com.comanda.service;
import com.comanda.dto.ProdutoRequest;
import com.comanda.entity.*;
import com.comanda.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service @RequiredArgsConstructor
public class ProdutoService {
    private final ProdutoRepository produtoRepo;
    private final CategoriaRepository categoriaRepo;
    private final ItemComandaRepository itemRepo;

    public List<Produto> listarDisponiveis() { return produtoRepo.findByDisponivelTrue(); }
    public List<Produto> listarTodos() { return produtoRepo.findAll(); }
    public List<Categoria> listarCategorias() { return categoriaRepo.findAll(); }

    public Produto salvar(ProdutoRequest req) {
        if (req.getNome() == null || req.getNome().isBlank())
            throw new RuntimeException("Nome é obrigatório");
        if (req.getPreco() == null || req.getPreco().compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Preço deve ser maior que zero");
        if (req.getCategoriaId() == null)
            throw new RuntimeException("Categoria é obrigatória");

        Categoria cat = categoriaRepo.findById(req.getCategoriaId())
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada: " + req.getCategoriaId()));

        return produtoRepo.save(Produto.builder()
            .nome(req.getNome().trim())
            .descricao(req.getDescricao())
            .preco(req.getPreco())
            .categoria(cat)
            .disponivel(req.getDisponivel() != null ? req.getDisponivel() : true)
            .imagemUrl(req.getImagemUrl())
            .build());
    }

    public Produto atualizar(Long id, ProdutoRequest req) {
        Produto p = produtoRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        Categoria cat = categoriaRepo.findById(req.getCategoriaId())
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        p.setNome(req.getNome());
        p.setDescricao(req.getDescricao());
        p.setPreco(req.getPreco());
        p.setCategoria(cat);
        p.setDisponivel(req.getDisponivel() != null ? req.getDisponivel() : true);
        p.setImagemUrl(req.getImagemUrl());
        return produtoRepo.save(p);
    }

    public void deletar(Long id) { produtoRepo.deleteById(id); }

    /**
     * Exclusão em massa (tudo-ou-nada, numa transação).
     * - produto que nunca foi vendido: é APAGADO;
     * - produto que já aparece em pedidos: não pode ser apagado sem destruir o histórico,
     *   então é apenas DESATIVADO (some do cardápio dos clientes).
     * Ids que já não existem são ignorados.
     */
    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> deletarVarios(List<Long> ids) {
        int excluidos = 0;
        int desativados = 0;
        if (ids != null) {
            for (Long id : ids.stream().filter(java.util.Objects::nonNull).distinct().toList()) {
                Produto p = produtoRepo.findById(id).orElse(null);
                if (p == null) continue;
                if (itemRepo.existsByProdutoId(id)) {
                    if (Boolean.TRUE.equals(p.getDisponivel())) {
                        p.setDisponivel(false);
                        produtoRepo.save(p);
                    }
                    desativados++;
                } else {
                    produtoRepo.delete(p);
                    excluidos++;
                }
            }
        }
        return java.util.Map.<String, Object>of("excluidos", excluidos, "desativados", desativados);
    }
}
