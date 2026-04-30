package com.comanda.service;
import com.comanda.entity.Comanda;
import com.comanda.entity.ItemComanda;
import com.comanda.repository.ComandaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class RelatorioService {
    private final ComandaRepository comandaRepo;

    public Map<String, Object> relatorioHoje() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay().minusHours(3);
        LocalDateTime fim = LocalDate.now().atTime(23, 59, 59).plusHours(3);
        return buildRelatorio(inicio, fim);
    }

    public Map<String, Object> relatorioPeriodo(String dataInicio, String dataFim) {
        LocalDateTime ini = LocalDate.parse(dataInicio).atStartOfDay();
        LocalDateTime fim = LocalDate.parse(dataFim).atTime(23, 59, 59);
        return buildRelatorio(ini, fim);
    }

    public List<Comanda> historico(String dataInicio, String dataFim) {
        // -3h para cobrir timezone Brasil (UTC-3)
        LocalDateTime ini = LocalDate.parse(dataInicio).atStartOfDay().minusHours(3);
        LocalDateTime fim = LocalDate.parse(dataFim).atTime(23, 59, 59).plusHours(3);
        return comandaRepo.findByPeriodo(ini, fim);
    }

    public List<Map<String, Object>> faturamentoPorDia(int dias) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        for (int i = dias - 1; i >= 0; i--) {
            LocalDate dia = LocalDate.now().minusDays(i);
            LocalDateTime ini = dia.atStartOfDay();
            LocalDateTime fim = dia.atTime(23, 59, 59);
            List<Comanda> comandas = comandaRepo.findByPeriodo(ini, fim);
            BigDecimal fat = comandas.stream()
                .filter(c -> c.getStatus() == Comanda.Status.FINALIZADA || c.getStatus() == Comanda.Status.PRONTA)
                .map(Comanda::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("data", dia.format(fmt));
            m.put("faturamento", fat);
            m.put("comandas", comandas.size());
            resultado.add(m);
        }
        return resultado;
    }

    private Map<String, Object> buildRelatorio(LocalDateTime inicio, LocalDateTime fim) {
        List<Comanda> todas = comandaRepo.findByPeriodo(inicio, fim);
        // Conta PRONTA + FINALIZADA como receita gerada
        List<Comanda> finalizadas = todas.stream()
            .filter(c -> c.getStatus() == Comanda.Status.FINALIZADA || c.getStatus() == Comanda.Status.PRONTA)
            .collect(Collectors.toList());
        List<Comanda> canceladas  = todas.stream().filter(c -> c.getStatus() == Comanda.Status.CANCELADA).collect(Collectors.toList());
        List<Comanda> abertas     = todas.stream().filter(c -> c.getStatus() == Comanda.Status.ABERTA).collect(Collectors.toList());

        BigDecimal faturamento = finalizadas.stream().map(Comanda::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ticketMedio = finalizadas.isEmpty() ? BigDecimal.ZERO
            : faturamento.divide(BigDecimal.valueOf(finalizadas.size()), 2, RoundingMode.HALF_UP);

        double taxaCancelamento = todas.isEmpty() ? 0
            : (canceladas.size() * 100.0) / todas.size();
        double taxaConversao = todas.isEmpty() ? 0
            : (finalizadas.size() * 100.0) / todas.size();

        // Top produtos
        Map<String, long[]> prodMap = new LinkedHashMap<>();
        for (Comanda c : finalizadas) {
            if (c.getItens() == null) continue;
            for (ItemComanda it : c.getItens()) {
                String nome = it.getProduto() != null ? it.getProduto().getNome() : "?";
                prodMap.computeIfAbsent(nome, k -> new long[]{0, 0});
                prodMap.get(nome)[0] += it.getQuantidade();
                prodMap.get(nome)[1] += it.getPrecoUnit().multiply(BigDecimal.valueOf(it.getQuantidade())).longValue();
            }
        }
        List<Map<String, Object>> topProdutos = prodMap.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
            .limit(5)
            .map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("nome", e.getKey());
                m.put("quantidade", e.getValue()[0]);
                m.put("receita", e.getValue()[1]);
                return m;
            }).collect(Collectors.toList());

        // Faturamento por hora (distribuição)
        Map<Integer, BigDecimal> porHora = new TreeMap<>();
        for (Comanda c : finalizadas) {
            if (c.getAbertaEm() != null) {
                int hora = c.getAbertaEm().getHour();
                porHora.merge(hora, c.getTotal(), BigDecimal::add);
            }
        }
        List<Map<String, Object>> distribuicaoHoraria = porHora.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("hora", String.format("%02dh", e.getKey()));
            m.put("faturamento", e.getValue());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("totalComandas", todas.size());
        r.put("comandasAbertas", abertas.size());
        r.put("comandasFinalizadas", finalizadas.size()); // inclui PRONTA + FINALIZADA
        r.put("comandasCanceladas", canceladas.size());
        r.put("comandasAbertas", abertas.size());
        r.put("faturamentoTotal", faturamento);
        r.put("ticketMedio", ticketMedio);
        r.put("taxaCancelamento", Math.round(taxaCancelamento * 10.0) / 10.0);
        r.put("taxaConversao", Math.round(taxaConversao * 10.0) / 10.0);
        r.put("totalItensVendidos", finalizadas.stream().flatMap(c -> c.getItens() != null ? c.getItens().stream() : java.util.stream.Stream.empty()).mapToLong(ItemComanda::getQuantidade).sum());
        r.put("topProdutos", topProdutos);
        r.put("distribuicaoHoraria", distribuicaoHoraria);
        return r;
    }
}
