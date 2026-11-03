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
        // Usuários padrão: criados SOMENTE na primeira execução (banco ainda sem usuários).
        // Assim, o que for excluído na aba "Usuários" não volta no próximo reinício do servidor.
        if (usuarioRepo.count() == 0) {
            criarUsuario("Administrador", "admin@comanda.com",        passwordEncoder.encode("admin123"),        "ADMIN");
            criarUsuario("Garcom",        "garcom@comanda.com",       passwordEncoder.encode("garcom123"),       "GARCOM");
            criarUsuario("Cozinha",       "cozinha@comanda.com",      passwordEncoder.encode("cozinha123"),      "COZINHA");
            criarUsuario("Copa",          "copa@comanda.com",         passwordEncoder.encode("copa123"),         "COPA");
            criarUsuario("Prato Quente",  "prato.quente@comanda.com", passwordEncoder.encode("prato.quente123"), "PRATO_QUENTE");
            criarUsuario("Prato Frio",    "prato.frio@comanda.com",   passwordEncoder.encode("prato.frio123"),   "PRATO_FRIO");
        }
        // Usuário do sistema: pedidos de cliente/delivery (sem login) são gravados em nome dele.
        // Sem ele esses pedidos falham, então é sempre garantido (e protegido contra exclusão).
        criarUsuario("Cliente App", "cliente@comanda.com", passwordEncoder.encode("cliente123"), "CLIENTE");
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
