package com.comanda.config;
import com.comanda.entity.*;
import com.comanda.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {
    private final UsuarioRepository usuarioRepo;
    private final CategoriaRepository categoriaRepo;
    private final MesaRepository mesaRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        String[] cats = {"Lanches","Bebidas","Sobremesas","Pratos","Porcoes"};
        for (String nome : cats) {
            if (categoriaRepo.findByNome(nome).isEmpty()) {
                Categoria c = new Categoria();
                c.setNome(nome);
                categoriaRepo.save(c);
            }
        }
        for (int i = 1; i <= 10; i++) {
            if (mesaRepo.findByNumero(i).isEmpty()) {
                Mesa m = new Mesa();
                m.setNumero(i);
                m.setStatus(Mesa.Status.LIVRE);
                mesaRepo.save(m);
            }
        }
        // Senhas individuais por usuario
        String senhaAdmin       = passwordEncoder.encode("admin123");
        String senhaGarcom      = passwordEncoder.encode("garcom123");
        String senhaCozinha     = passwordEncoder.encode("cozinha123");
        String senhaCopa        = passwordEncoder.encode("copa123");
        String senhaPratoQuente = passwordEncoder.encode("prato.quente123");
        String senhaPratoFrio   = passwordEncoder.encode("prato.frio123");
        String senhaCliente     = passwordEncoder.encode("cliente123");
        criarUsuario("Administrador","admin@comanda.com",   senhaAdmin,"ADMIN");
        criarUsuario("Garcom",       "garcom@comanda.com",  senhaGarcom,"GARCOM");
        criarUsuario("Cozinha",      "cozinha@comanda.com", senhaCozinha,"COZINHA");
        criarUsuario("Copa",         "copa@comanda.com",    senhaCopa,"COPA");
        criarUsuario("Prato Quente", "prato.quente@comanda.com", senhaPratoQuente,"PRATO_QUENTE");
        criarUsuario("Prato Frio",   "prato.frio@comanda.com",   senhaPratoFrio,"PRATO_FRIO");
        criarUsuario("Cliente App",  "cliente@comanda.com", senhaCliente,"CLIENTE");
        System.out.println("=== DataInitializer: dados verificados ===");
    }

    private void criarUsuario(String nome, String email, String senha, String role) {
        try {
            if (usuarioRepo.findByEmail(email).isEmpty()) {
                Usuario u = new Usuario();
                u.setNome(nome);
                u.setEmail(email);
                u.setSenha(senha);
                u.setRole(Usuario.Role.valueOf(role));
                u.setAtivo(true);
                usuarioRepo.save(u);
                System.out.println("=== Criado: " + email);
            }
        } catch (Exception e) {
            System.out.println("=== ERRO ao criar " + email + ": " + e.getMessage());
        }
    }
}
