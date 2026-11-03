package com.comanda.digital.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @DeleteMapping("/lote")
    public ResponseEntity<Void> excluirEmMassa(@RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        // repository.deleteAllById(ids);
        return ResponseEntity.noContent().build();
    }
}
