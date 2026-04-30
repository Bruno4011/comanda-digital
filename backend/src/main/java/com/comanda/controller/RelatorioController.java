package com.comanda.controller;
import com.comanda.entity.Comanda;
import com.comanda.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController @RequestMapping("/api/relatorios") @RequiredArgsConstructor
public class RelatorioController {
    private final RelatorioService relatorioService;
    @GetMapping("/hoje")         public Map<String, Object> hoje() { return relatorioService.relatorioHoje(); }
    @GetMapping("/periodo")      public Map<String, Object> periodo(@RequestParam String dataInicio, @RequestParam String dataFim) { return relatorioService.relatorioPeriodo(dataInicio, dataFim); }
    @GetMapping("/historico")    public List<Comanda> historico(@RequestParam String dataInicio, @RequestParam String dataFim) { return relatorioService.historico(dataInicio, dataFim); }
    @GetMapping("/faturamento-diario") public List<Map<String, Object>> faturamentoDiario(@RequestParam(defaultValue = "7") int dias) { return relatorioService.faturamentoPorDia(dias); }
}
