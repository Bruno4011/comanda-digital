package com.comanda.controller;
import com.comanda.entity.Mesa;
import com.comanda.repository.MesaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api/mesas") @RequiredArgsConstructor
public class MesaController {
    private final MesaRepository mesaRepo;

    @GetMapping
    public List<Mesa> listar() { return mesaRepo.findAll(); }

    @GetMapping("/livres")
    public List<Mesa> livres() { return mesaRepo.findByStatus(Mesa.Status.LIVRE); }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Mesa> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return mesaRepo.findById(id).map(m -> {
            m.setStatus(Mesa.Status.valueOf(body.get("status")));
            return ResponseEntity.ok(mesaRepo.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }
}
