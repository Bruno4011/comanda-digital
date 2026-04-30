package com.comanda.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Entity @Table(name = "comandas")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Comanda {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mesa_id")
    private Mesa mesa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id")
    @JsonIgnoreProperties({"senha", "hibernateLazyInitializer"})
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Builder.Default @Column(nullable = false)
    private Status status = Status.ABERTA;

    @Column(columnDefinition = "TEXT") private String observacoes;

    @Builder.Default @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Builder.Default @Column(name = "aberta_em")
    private LocalDateTime abertaEm = LocalDateTime.now();

    @Column(name = "fechada_em") private LocalDateTime fechadaEm;

    @OneToMany(mappedBy = "comanda", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ItemComanda> itens = new ArrayList<>();

    public enum Status { ABERTA, EM_PREPARO, PRONTA, FINALIZADA, CANCELADA }
}
