package ru.tms.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.tms.auth.dto.AdminCreateUserRequest;
import ru.tms.auth.dto.AdminUpdateUserRequest;
import ru.tms.auth.dto.AuthResponse;
import ru.tms.auth.dto.LoginRequest;
import ru.tms.auth.dto.RefreshRequest;
import ru.tms.auth.dto.RegisterRequest;
import ru.tms.auth.service.AuthService;
import ru.tms.common.dto.UserDto;
import ru.tms.common.security.JwtUtil;

/**
 * Контроллер аутентификации и управления пользователями.
 * Публичные эндпоинты: /register, /login, /refresh.
 * Остальные требуют валидный JWT-токен.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Аутентификация", description = "Регистрация, вход, обновление токена, управление пользователями")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    // ── Публичные эндпоинты ───────────────────────────────────────

    @Operation(
        summary = "Регистрация нового пользователя",
        description = "Создаёт аккаунт с ролью CLIENT. Возвращает JWT access- и refresh-токены."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Пользователь успешно зарегистрирован"),
        @ApiResponse(responseCode = "400", description = "Некорректные данные (валидация)"),
        @ApiResponse(responseCode = "409", description = "Email уже используется")
    })
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @Operation(
        summary = "Вход по email и паролю",
        description = "Проверяет учётные данные и возвращает JWT access- и refresh-токены."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Успешный вход"),
        @ApiResponse(responseCode = "401", description = "Неверный email или пароль"),
        @ApiResponse(responseCode = "404", description = "Пользователь не найден")
    })
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @Operation(
        summary = "Обновление access-токена",
        description = "Принимает refresh-токен, возвращает новую пару access + refresh. Старый refresh-токен инвалидируется."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Токены успешно обновлены"),
        @ApiResponse(responseCode = "401", description = "Refresh-токен недействителен или истёк")
    })
    @PostMapping("/refresh")
    public AuthResponse refresh(
            @Valid @RequestBody RefreshRequest request,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        return authService.refresh(request, userId);
    }

    // ── Защищённые эндпоинты (требуют JWT) ───────────────────────

    @Operation(
        summary = "Выход из системы",
        description = "Удаляет refresh-токен из Redis и добавляет access-токен в blacklist.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Выход выполнен"),
        @ApiResponse(responseCode = "401", description = "Токен отсутствует или недействителен")
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Parameter(hidden = true) @RequestHeader("Authorization") String authHeader,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Parameter(description = "Refresh-токен для инвалидации") @RequestParam(required = false) String refreshToken) {
        String token = authHeader.substring(7); // убираем префикс "Bearer "
        authService.logout(token, userId, refreshToken);
        return ResponseEntity.noContent().build();
    }

    @Operation(
        summary = "Получить профиль текущего пользователя",
        description = "Возвращает данные авторизованного пользователя на основе JWT-токена.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Профиль получен"),
        @ApiResponse(responseCode = "401", description = "Не авторизован")
    })
    @GetMapping("/me")
    public UserDto me(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        return authService.getMe(userId);
    }

    @Operation(
        summary = "Получить пользователя по ID",
        description = "Доступен самому пользователю, менеджеру и администратору.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Пользователь найден"),
        @ApiResponse(responseCode = "403", description = "Доступ запрещён"),
        @ApiResponse(responseCode = "404", description = "Пользователь не найден")
    })
    @GetMapping("/users/{id}")
    public UserDto getUserById(
            @Parameter(description = "ID пользователя") @PathVariable Long id,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long requesterId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String requesterRole) {
        if (!id.equals(requesterId) && !requesterRole.contains("ADMIN") && !requesterRole.contains("MANAGER")) {
            throw new ru.tms.common.exception.UnauthorizedException("Доступ запрещён");
        }
        return authService.getById(id);
    }

    // ── Административные эндпоинты (только ADMIN) ────────────────

    @Operation(
        summary = "Создать пользователя вручную (ADMIN)",
        description = "Администратор создаёт аккаунт с любой ролью и указанным паролем.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Пользователь создан"),
        @ApiResponse(responseCode = "400", description = "Некорректные данные"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "409", description = "Email уже занят")
    })
    @PostMapping("/admin/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto adminCreateUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return authService.createUser(request);
    }

    @Operation(
        summary = "Список всех пользователей (ADMIN)",
        description = "Возвращает страницу пользователей с опциональной фильтрацией по роли.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Список получен")
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserDto> adminListUsers(
            @Parameter(description = "Фильтр по роли: ADMIN, MANAGER, DRIVER, CLIENT")
            @RequestParam(required = false) ru.tms.common.enums.Role role,
            Pageable pageable) {
        return authService.listUsers(role, pageable);
    }

    @Operation(
        summary = "Обновить данные пользователя (ADMIN)",
        description = "Изменяет имя, фамилию или роль пользователя.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Данные обновлены"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "404", description = "Пользователь не найден")
    })
    @PutMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto adminUpdateUser(
            @Parameter(description = "ID пользователя") @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return authService.updateUser(id, request);
    }

    @Operation(
        summary = "Удалить пользователя (ADMIN)",
        description = "Безвозвратно удаляет аккаунт пользователя из системы.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Пользователь удалён"),
        @ApiResponse(responseCode = "403", description = "Требуется роль ADMIN"),
        @ApiResponse(responseCode = "404", description = "Пользователь не найден")
    })
    @DeleteMapping("/admin/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void adminDeleteUser(
            @Parameter(description = "ID пользователя") @PathVariable Long id) {
        authService.deleteUser(id);
    }
}
