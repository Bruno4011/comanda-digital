package com.comanda.repository;
import com.comanda.entity.ItemComanda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ItemComandaRepository extends JpaRepository<ItemComanda, Long> {
    List<ItemComanda> findByComandaId(Long comandaId);
    List<ItemComanda> findByStatus(ItemComanda.Status status);
}