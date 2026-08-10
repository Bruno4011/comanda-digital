package com.comanda.repository;
import com.comanda.entity.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MesaRepository extends JpaRepository<Mesa, Long> {
    List<Mesa> findByStatus(Mesa.Status status);
    List<Mesa> findAllByOrderByNumeroAsc();
}
