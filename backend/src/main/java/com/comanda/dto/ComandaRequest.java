package com.comanda.dto;
import lombok.Data;
import java.util.List;
@Data
public class ComandaRequest {
    private Long mesaId;
    private String observacoes;
    private List<ItemRequest> itens;
    @Data
    public static class ItemRequest {
        private Long produtoId;
        private Integer quantidade;
        private String observacoes;
    }
}