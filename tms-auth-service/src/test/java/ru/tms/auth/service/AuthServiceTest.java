package ru.tms.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import ru.tms.auth.dto.AuthResponse;
import ru.tms.auth.dto.LoginRequest;
import ru.tms.auth.dto.RefreshRequest;
import ru.tms.auth.dto.RegisterRequest;
import ru.tms.auth.entity.User;
import ru.tms.auth.repository.UserRepository;
import ru.tms.common.enums.Role;
import ru.tms.common.exception.BusinessException;
import ru.tms.common.exception.UnauthorizedException;
import ru.tms.common.security.JwtProperties;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private TokenService tokenService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties();
        props.setSecret("test-secret-key-at-least-32-chars-long!");
        props.setAccessExpiration(900_000L);
        props.setRefreshExpiration(604_800_000L);

        authService = new AuthService(
                userRepository, passwordEncoder, authenticationManager, tokenService, props);
    }

    private RegisterRequest registerRequest(String email, String password, String first, String last) {
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword(password);
        req.setFirstName(first);
        req.setLastName(last);
        return req;
    }

    private LoginRequest loginRequest(String email, String password) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    private RefreshRequest refreshRequest(String token) {
        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken(token);
        return req;
    }

    @Test
    void register_newUser_returnsTokens() {
        RegisterRequest req = registerRequest("new@test.com", "Password1!", "Ivan", "Petrov");

        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        User saved = User.builder()
                .id(1L).email("new@test.com").role(Role.CLIENT).build();
        when(userRepository.save(any())).thenReturn(saved);
        when(tokenService.issueAccessToken(saved)).thenReturn("access-token");
        when(tokenService.issueRefreshToken(saved)).thenReturn("refresh-token");

        AuthResponse resp = authService.register(req);

        assertThat(resp.getAccessToken()).isEqualTo("access-token");
        assertThat(resp.getRefreshToken()).isEqualTo("refresh-token");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsBusinessException() {
        RegisterRequest req = registerRequest("exists@test.com", "Password1!", "Ivan", "Petrov");

        when(userRepository.existsByEmail("exists@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void login_validCredentials_returnsTokens() {
        LoginRequest req = loginRequest("user@test.com", "password");

        User user = User.builder()
                .id(2L).email("user@test.com").role(Role.MANAGER).build();

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(tokenService.issueAccessToken(user)).thenReturn("acc");
        when(tokenService.issueRefreshToken(user)).thenReturn("ref");

        AuthResponse resp = authService.login(req);

        assertThat(resp.getAccessToken()).isEqualTo("acc");
        verify(authenticationManager).authenticate(
                argThat(a -> ((UsernamePasswordAuthenticationToken) a)
                        .getPrincipal().equals("user@test.com")));
    }

    @Test
    void login_badCredentials_propagatesException() {
        LoginRequest req = loginRequest("x@test.com", "wrong");

        doThrow(new BadCredentialsException("Bad"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void refresh_validToken_rotatesTokens() {
        Long userId = 5L;
        RefreshRequest req = refreshRequest("old-refresh");

        User user = User.builder().id(userId).email("u@t.com").role(Role.CLIENT).build();

        when(tokenService.findUserIdByRefreshToken(userId, "old-refresh")).thenReturn("5");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(tokenService.issueAccessToken(user)).thenReturn("new-access");
        when(tokenService.issueRefreshToken(user)).thenReturn("new-refresh");

        AuthResponse resp = authService.refresh(req, userId);

        assertThat(resp.getAccessToken()).isEqualTo("new-access");
        assertThat(resp.getRefreshToken()).isEqualTo("new-refresh");
        verify(tokenService).revokeRefreshToken("old-refresh", userId);
    }

    @Test
    void refresh_invalidToken_throwsUnauthorized() {
        when(tokenService.findUserIdByRefreshToken(anyLong(), any())).thenReturn(null);

        assertThatThrownBy(() -> authService.refresh(refreshRequest("bad"), 1L))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void logout_callsBlacklistAndRevoke() {
        authService.logout("access-tok", 1L, "refresh-tok");

        verify(tokenService).revokeRefreshToken("refresh-tok", 1L);
        verify(tokenService).blacklistAccessToken("access-tok");
    }

    @Test
    void getMe_existingUser_returnsDto() {
        User user = User.builder()
                .id(7L).email("me@test.com")
                .firstName("Anya").lastName("Smirnova").role(Role.ADMIN).build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        var dto = authService.getMe(7L);

        assertThat(dto.getEmail()).isEqualTo("me@test.com");
        assertThat(dto.getRole()).isEqualTo(Role.ADMIN);
    }
}
