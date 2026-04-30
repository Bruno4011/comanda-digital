package com.comanda.dto;
import lombok.*;
@Data @AllArgsConstructor
public class LoginResponse {
    private String token;
    private String nome;
    private String role;
    private Long id;
}