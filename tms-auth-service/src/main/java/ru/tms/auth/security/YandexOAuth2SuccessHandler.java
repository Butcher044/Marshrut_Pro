package ru.tms.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.tms.auth.entity.User;
import ru.tms.auth.repository.UserRepository;
import ru.tms.auth.service.TokenService;
import ru.tms.common.enums.Role;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class YandexOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final TokenService tokenService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        Object idAttr = oauthUser.getAttribute("id");
        String yandexId = idAttr != null ? idAttr.toString() : "unknown";
        Object emailAttr = oauthUser.getAttribute("default_email");
        String email = emailAttr != null ? emailAttr.toString() : null;
        Object firstNameAttr = oauthUser.getAttribute("first_name");
        String firstName = firstNameAttr != null ? firstNameAttr.toString() : null;
        Object lastNameAttr = oauthUser.getAttribute("last_name");
        String lastName = lastNameAttr != null ? lastNameAttr.toString() : null;

        if (email == null) email = yandexId + "@yandex.ru";
        if (firstName == null) firstName = "Yandex";
        if (lastName == null) lastName = "User";

        final String finalEmail = email;
        final String finalFirstName = firstName;
        final String finalLastName = lastName;

        User user = userRepository.findByYandexId(yandexId).orElseGet(() -> {
            User newUser = User.builder()
                    .email(finalEmail)
                    .firstName(finalFirstName)
                    .lastName(finalLastName)
                    .role(Role.CLIENT)
                    .yandexId(yandexId)
                    .build();
            return userRepository.save(newUser);
        });

        // Update profile info on each login
        user.setFirstName(finalFirstName);
        user.setLastName(finalLastName);
        userRepository.save(user);

        String accessToken = tokenService.issueAccessToken(user);
        String refreshToken = tokenService.issueRefreshToken(user);

        String redirectUrl = frontendUrl + "/oauth2/callback?token=" + accessToken
                + "&refresh=" + refreshToken;

        response.sendRedirect(redirectUrl);
    }
}
