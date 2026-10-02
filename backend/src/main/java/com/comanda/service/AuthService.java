package com.comanda.service;
import com.comanda.dto.*;
import com.comanda.entity.Usuario;
import com.comanda.repository.UsuarioRepository;
import com.comanda.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
@Service @RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest req) {
        Usuario u = usuarioRepo.findByEmail(req.getEmail())
            .orElseThrow(() -> new RuntimeException("Credenciais inválidas"));
        if (!u.getAtivo()) throw new RuntimeException("Usuário inativo");
        if (!encoder.matches(req.getSenha(), u.getSenha()))
            throw new RuntimeException("Credenciais inválidas");
        String token = jwtUtil.gerarToken(u.getEmail(), u.getRole().name());
        return new LoginResponse(token, u.getNome(), u.getRole().name(), u.getId());
    }
}