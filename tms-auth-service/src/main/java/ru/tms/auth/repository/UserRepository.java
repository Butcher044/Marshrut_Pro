package ru.tms.auth.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.tms.auth.entity.User;
import ru.tms.common.enums.Role;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByYandexId(String yandexId);
    boolean existsByEmail(String email);
    Page<User> findByRole(Role role, Pageable pageable);
}
