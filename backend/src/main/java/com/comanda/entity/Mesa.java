package com.comanda.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name = "mesas")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Mesa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private Integer numero;
    @Enumerated(EnumType.STRING) @Builder.Default @Column(nullable = false) private Status status = Status.LIVRE;
    public enum Status { LIVRE, OCUPADA, RESERVADA }
}