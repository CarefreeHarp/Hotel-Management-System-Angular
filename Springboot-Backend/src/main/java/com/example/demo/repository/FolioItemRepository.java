package com.example.demo.repository;

import com.example.demo.entities.FolioItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FolioItemRepository extends JpaRepository<FolioItem, Integer> {
    List<FolioItem> findByFolio_FolioIdOrderByChargedAtAsc(Integer id);
}
