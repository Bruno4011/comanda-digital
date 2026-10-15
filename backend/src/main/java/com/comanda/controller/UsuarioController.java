package com.comanda.controller;
import com.comanda.dto.UsuarioRequest;
import com.comanda.entity.Usuario;
import com.comanda.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<Usuario> criar(@RequestBody UsuarioRequest req) {
        if (req.getNome() == null || req.getNome().isBlank())
            throw new RuntimeException("Nome é obrigatório");
        if (req.getEmail() == null || req.getEmail().isBlank())
            throw new RuntimeException("Email é obrigatório");
        if (req.getSenha() == null || req.getSenha().isBlank())
            throw new RuntimeException("Senha é obrigatória");
        if (req.getRole() == null || req.getRole().isBlank())
            throw new RuntimeException("Role é obrigatória");
        if (usuarioRepo.findByEmail(req.getEmail()).isPresent())
            throw new RuntimeException("Email já cadastrado");

        Usuario u = Usuario.builder()
            .nome(req.getNome().trim())
            .email(req.getEmail().trim().toLowerCase())
            .senha(passwordEncoder.encode(req.getSenha()))
            .role(Usuario.Role.valueOf(req.getRole()))
            .ativo(req.getAtivo() != null ? req.getAtivo() : true)
            .build();
        return ResponseEntity.ok(usuarioRepo.save(u));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizar(@PathVariable Long id, @RequestBody UsuarioRequest req) {
        Usuario u = usuarioRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (req.getNome() != null && !req.getNome().isBlank())
            u.setNome(req.getNome().trim());
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            // Check email not taken by another user
            usuarioRepo.findByEmail(req.getEmail()).ifPresent(existing -> {
                if (!existing.getId().equals(id))
                    throw new RuntimeException("Email já em uso por outro usuário");
            });
            u.setEmail(req.getEmail().trim().toLowerCase());
        }
        if (req.getSenha() != null && !req.getSenha().isBlank())
            u.setSenha(passwordEncoder.encode(req.getSenha()));
        if (req.getRole() != null && !req.getRole().isBlank())
            u.setRole(Usuario.Role.valueOf(req.getRole()));
        if (req.getAtivo() != null)
            u.setAtivo(req.getAtivo());

        return ResponseEntity.ok(usuarioRepo.save(u));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletar(@PathVariable Long id) {
        Usuario u = usuarioRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if (u.getRole() == Usuario.Role.ADMIN)
            throw new RuntimeException("Não é possível excluir o administrador.");
        usuarioRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário excluído com sucesso."));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Usuario> toggleAtivo(@PathVariable Long id) {
        Usuario u = usuarioRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if (u.getRole() == Usuario.Role.ADMIN)
            throw new RuntimeException("Não é possível desativar o administrador.");
        u.setAtivo(!u.getAtivo());
        return ResponseEntity.ok(usuarioRepo.save(u));
    }
}
