package com.comanda.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "produtos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Produto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String nome;
    @Column(columnDefinition = "TEXT") private String descricao;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal preco;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id", nullable = false) private Categoria categoria;
    @Builder.Default @Column(nullable = false) private Boolean disponivel = true;
    @Column(name = "imagem_url", length = 500) private String imagemUrl;
    @Builder.Default @Column(name = "criado_em") private LocalDateTime criadoEm = LocalDateTime.now();
}
