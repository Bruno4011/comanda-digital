package com.comanda.controller;
import com.comanda.dto.ComandaRequest;
import com.comanda.entity.*;
import com.comanda.service.ComandaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController @RequestMapping("/api/comandas") @RequiredArgsConstructor
public class ComandaController {
    private final ComandaService comandaService;

    @PostMapping
    public ResponseEntity<Comanda> abrir(@RequestBody ComandaRequest req, @AuthenticationPrincipal Usuario u) {
        // u pode ser null para pedidos de cliente/delivery (sem login)
        String email = u != null ? u.getEmail() : "cliente@comanda.com";
        return ResponseEntity.ok(comandaService.abrirComanda(req, email));
    }

    @GetMapping("/abertas")  public List<Comanda> abertas()    { return comandaService.listarAbertas(); }
    @GetMapping("/em-preparo") public List<Comanda> emPreparo() { return comandaService.listarEmPreparo(); }
    @GetMapping("/prontas")  public List<Comanda> prontas()    { return comandaService.listarProntas(); }
    @GetMapping            public List<Comanda> todas()        { return comandaService.listarTodas(); }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Comanda> status(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(comandaService.atualizarStatus(id, body.get("status")));
    }
    @PostMapping("/{id}/itens")
    public ResponseEntity<ItemComanda> addItem(@PathVariable Long id, @RequestBody ComandaRequest.ItemRequest req) {
        return ResponseEntity.ok(comandaService.adicionarItem(id, req));
    }
    @GetMapping("/itens/pendentes") public List<ItemComanda> itensPendentes() { return comandaService.itensPendentes(); }
    @PatchMapping("/itens/{id}/status")
    public ResponseEntity<ItemComanda> statusItem(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(comandaService.atualizarStatusItem(id, body.get("status")));
    }
}
