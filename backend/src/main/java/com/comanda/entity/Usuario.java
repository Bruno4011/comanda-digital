package com.comanda.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "usuarios")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 100) private String nome;
    @Column(nullable = false, unique = true, length = 150) private String email;
    @Column(nullable = false) @JsonIgnore private String senha;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    @Builder.Default @Column(nullable = false) private Boolean ativo = true;
    @Builder.Default @Column(name = "criado_em") private LocalDateTime criadoEm = LocalDateTime.now();
    public enum Role { ADMIN, GARCOM, COZINHA, COPA, PRATO_QUENTE, PRATO_FRIO, CLIENTE }
}