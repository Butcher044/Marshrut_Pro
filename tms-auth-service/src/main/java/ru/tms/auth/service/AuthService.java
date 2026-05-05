package ru.tms.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ru.tms.auth.dto.AdminCreateUserRequest;
import ru.tms.auth.dto.AdminUpdateUserRequest;
import ru.tms.auth.dto.AuthResponse;
import ru.tms.auth.dto.LoginRequest;
import ru.tms.auth.dto.RefreshRequest;
import ru.tms.auth.dto.RegisterRequest;
import ru.tms.auth.entity.User;
import ru.tms.auth.repository.UserRepository;
import ru.tms.common.dto.UserDto;
import ru.tms.common.enums.Role;
import ru.tms.common.exception.BusinessException;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.common.exception.UnauthorizedException;
import ru.tms.common.security.JwtProperties;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.CLIENT)
                .build();

        user = userRepository.save(user);

        String accessToken = tokenService.issueAccessToken(user);
        String refreshToken = tokenService.issueRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtProperties.getAccessExpiration() / 1000)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", null));

        // Revoke any old refresh tokens to prevent unbounded session accumulation
        tokenService.revokeAllRefreshTokens(user.getId());

        String accessToken = tokenService.issueAccessToken(user);
        String refreshToken = tokenService.issueRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtProperties.getAccessExpiration() / 1000)
                .build();
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request, Long userId) {
        String found = tokenService.findUserIdByRefreshToken(userId, request.getRefreshToken());
        if (found == null) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        tokenService.revokeRefreshToken(request.getRefreshToken(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String newAccessToken = tokenService.issueAccessToken(user);
        String newRefreshToken = tokenService.issueRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtProperties.getAccessExpiration() / 1000)
                .build();
    }

    public void logout(String accessToken, Long userId, String refreshToken) {
        if (refreshToken != null) {
            tokenService.revokeRefreshToken(refreshToken, userId);
        }
        tokenService.blacklistAccessToken(accessToken);
    }

    public UserDto getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return toDto(user);
    }

    public UserDto getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toDto(user);
    }

    @Transactional
    public UserDto createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already in use");
        }
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .build();
        return toDto(userRepository.save(user));
    }

    public Page<UserDto> listUsers(Role role, Pageable pageable) {
        if (role != null) {
            return userRepository.findByRole(role, pageable).map(this::toDto);
        }
        return userRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public UserDto updateUser(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());
        return toDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        userRepository.deleteById(id);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
