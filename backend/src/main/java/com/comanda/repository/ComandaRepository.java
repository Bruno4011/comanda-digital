package com.comanda.repository;
import com.comanda.entity.Comanda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ComandaRepository extends JpaRepository<Comanda, Long> {

    @Query("SELECT DISTINCT c FROM Comanda c LEFT JOIN FETCH c.itens i LEFT JOIN FETCH i.produto LEFT JOIN FETCH c.mesa WHERE c.status = :status ORDER BY c.abertaEm ASC")
    List<Comanda> findByStatus(@Param("status") Comanda.Status status);

    @Query("SELECT DISTINCT c FROM Comanda c LEFT JOIN FETCH c.itens i LEFT JOIN FETCH i.produto WHERE c.mesa IS NOT NULL AND c.mesa.id = :mesaId")
    List<Comanda> findByMesaId(@Param("mesaId") Long mesaId);

    @Query("SELECT DISTINCT c FROM Comanda c LEFT JOIN FETCH c.itens i LEFT JOIN FETCH i.produto LEFT JOIN FETCH c.mesa WHERE c.abertaEm >= :inicio AND c.abertaEm <= :fim ORDER BY c.abertaEm DESC")
    List<Comanda> findByPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    @Query("SELECT DISTINCT c FROM Comanda c LEFT JOIN FETCH c.itens i LEFT JOIN FETCH i.produto LEFT JOIN FETCH c.mesa ORDER BY c.abertaEm DESC")
    List<Comanda> findAllWithItens();
}
