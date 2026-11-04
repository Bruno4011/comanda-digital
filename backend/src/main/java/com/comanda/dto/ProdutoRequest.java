package com.comanda.dto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProdutoRequest {
    private String nome;
    private String descricao;
    private BigDecimal preco;
    private Long categoriaId;
    private Boolean disponivel = true;
    private String imagemUrl;
}
