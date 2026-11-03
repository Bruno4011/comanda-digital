package com.comanda.service;
import com.comanda.dto.ComandaRequest;
import com.comanda.entity.*;
import com.comanda.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class ComandaService {
    private final ComandaRepository comandaRepo;
    private final ItemComandaRepository itemRepo;
    private final MesaRepository mesaRepo;
    private final ProdutoRepository produtoRepo;
    private final UsuarioRepository usuarioRepo;

    @Transactional
    public Comanda abrirComanda(ComandaRequest req, String emailUsuario) {
        Mesa mesa = null;
        if (req.getMesaId() != null) {
            mesa = mesaRepo.findById(req.getMesaId())
                .orElseThrow(() -> new RuntimeException("Mesa não encontrada"));
            // Só ocupa se estiver livre
            if (mesa.getStatus() != Mesa.Status.LIVRE) {
                throw new RuntimeException("Mesa " + mesa.getNumero() + " já está ocupada");
            }
            mesa.setStatus(Mesa.Status.OCUPADA);
            mesaRepo.save(mesa);
        }

        Usuario usuario = usuarioRepo.findByEmail(emailUsuario)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Comanda comanda = Comanda.builder()
            .mesa(mesa).usuario(usuario)
            .observacoes(req.getObservacoes())
            .build();
        comanda = comandaRepo.save(comanda);

        BigDecimal total = BigDecimal.ZERO;
        if (req.getItens() != null) {
            for (var ir : req.getItens()) {
                Produto p = produtoRepo.findById(ir.getProdutoId())
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + ir.getProdutoId()));
                ItemComanda item = ItemComanda.builder()
                    .comanda(comanda).produto(p)
                    .quantidade(ir.getQuantidade())
                    .precoUnit(p.getPreco())
                    .observacoes(ir.getObservacoes())
                    .build();
                itemRepo.save(item);
                total = total.add(p.getPreco().multiply(BigDecimal.valueOf(ir.getQuantidade())));
            }
        }
        comanda.setTotal(total);
        return comandaRepo.save(comanda);
    }

    public List<Comanda> listarAbertas()   { return comandaRepo.findByStatus(Comanda.Status.ABERTA); }
    public List<Comanda> listarEmPreparo() { return comandaRepo.findByStatus(Comanda.Status.EM_PREPARO); }
    public List<Comanda> listarProntas()   { return comandaRepo.findByStatus(Comanda.Status.PRONTA); }
    public List<Comanda> listarTodas()     { return comandaRepo.findAllWithItens(); }

    @Transactional
    public Comanda atualizarStatus(Long id, String status) {
        Comanda c = comandaRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Comanda não encontrada"));
        c.setStatus(Comanda.Status.valueOf(status));

        if (status.equals("FINALIZADA") || status.equals("CANCELADA")) {
            c.setFechadaEm(LocalDateTime.now());
            // FIX: buscar mesa fresh do banco para garantir persistência correta
            if (c.getMesa() != null) {
                mesaRepo.findById(c.getMesa().getId()).ifPresent(mesa -> {
                    mesa.setStatus(Mesa.Status.LIVRE);
                    mesaRepo.saveAndFlush(mesa);
                });
            }
        }
        return comandaRepo.save(c);
    }

    @Transactional
    public ItemComanda adicionarItem(Long comandaId, ComandaRequest.ItemRequest req) {
        Comanda c = comandaRepo.findById(comandaId)
            .orElseThrow(() -> new RuntimeException("Comanda não encontrada"));
        Produto p = produtoRepo.findById(req.getProdutoId())
            .orElseThrow(() -> new RuntimeException("Produto não encontrado"));
        ItemComanda item = ItemComanda.builder()
            .comanda(c).produto(p)
            .quantidade(req.getQuantidade())
            .precoUnit(p.getPreco())
            .observacoes(req.getObservacoes())
            .build();
        item = itemRepo.save(item);
        c.setTotal(c.getTotal().add(p.getPreco().multiply(BigDecimal.valueOf(req.getQuantidade()))));
        comandaRepo.save(c);
        return item;
    }

    @Transactional
    public void deletar(Long id) {
        Comanda c = comandaRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Comanda não encontrada: " + id));
        liberarMesaSeAtiva(c);
        comandaRepo.delete(c);
    }

    /**
     * Exclusão em massa: tudo-ou-nada (uma única transação). Ids que já não existem são ignorados.
     * Devolve quantas comandas foram realmente excluídas.
     */
    @Transactional
    public int deletarVarias(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        List<Long> unicos = ids.stream().filter(java.util.Objects::nonNull).distinct().toList();
        int total = 0;
        for (int i = 0; i < unicos.size(); i += 500) {            // lotes de 500 (limite de parâmetros do SQL)
            List<Long> lote = unicos.subList(i, Math.min(i + 500, unicos.size()));
            List<Comanda> comandas = comandaRepo.findAllById(lote);
            for (Comanda c : comandas) liberarMesaSeAtiva(c);
            comandaRepo.deleteAll(comandas);                      // apaga também os itens (cascade)
            total += comandas.size();
        }
        return total;
    }

    /** Só comandas ainda ativas ocupam mesa; as finalizadas/canceladas não mexem na mesa. */
    private void liberarMesaSeAtiva(Comanda c) {
        if (c.getMesa() != null
                && c.getStatus() != Comanda.Status.FINALIZADA
                && c.getStatus() != Comanda.Status.CANCELADA) {
            mesaRepo.findById(c.getMesa().getId()).ifPresent(mesa -> {
                mesa.setStatus(Mesa.Status.LIVRE);
                mesaRepo.save(mesa);
            });
        }
    }

    public List<ItemComanda> itensPendentes() { return itemRepo.findByStatus(ItemComanda.Status.PENDENTE); }

    @Transactional
    public ItemComanda atualizarStatusItem(Long itemId, String status) {
        ItemComanda item = itemRepo.findById(itemId)
            .orElseThrow(() -> new RuntimeException("Item não encontrado"));
        item.setStatus(ItemComanda.Status.valueOf(status));
        return itemRepo.save(item);
    }
}
