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
        String senha = passwordEncoder.encode("admin123");
        criarUsuario("Administrador","admin@comanda.com",   senha,"ADMIN");
        criarUsuario("Garcom",       "garcom@comanda.com",  senha,"GARCOM");
        criarUsuario("Cozinha",      "cozinha@comanda.com", senha,"COZINHA");
        criarUsuario("Cliente App",  "cliente@comanda.com", senha,"CLIENTE");
        System.out.println("=== DataInitializer: dados verificados ===");
    }

    private void criarUsuario(String nome, String email, String senha, String role) {
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
    }
}
