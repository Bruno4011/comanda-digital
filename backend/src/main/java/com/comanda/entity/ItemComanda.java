package com.comanda.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Entity @Table(name = "itens_comanda")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemComanda {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comanda_id", nullable = false)
    private Comanda comanda;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Builder.Default @Column(nullable = false) private Integer quantidade = 1;
    @Column(name = "preco_unit", nullable = false, precision = 10, scale = 2) private BigDecimal precoUnit;
    @Column(length = 500) private String observacoes;
    @Enumerated(EnumType.STRING) @Builder.Default @Column(nullable = false) private Status status = Status.PENDENTE;
    public enum Status { PENDENTE, PREPARO, PRONTO, ENTREGUE, CANCELADO }
}
