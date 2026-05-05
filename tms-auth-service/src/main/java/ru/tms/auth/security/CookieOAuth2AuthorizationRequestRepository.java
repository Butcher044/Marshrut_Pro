package ru.tms.auth.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

/**
 * Stores the OAuth2 authorization request state in an HttpOnly cookie
 * instead of the HTTP session — required because the auth service uses
 * SessionCreationPolicy.STATELESS which prevents session creation.
 */
@Component
public class CookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private static final String COOKIE_NAME = "oauth2_req";
    private static final int MAX_AGE = 300; // 5 minutes

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return findCookie(request, COOKIE_NAME)
                .map(this::deserialize)
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            eraseCookie(response);
            return;
        }
        writeCookie(response, COOKIE_NAME, serialize(authorizationRequest), MAX_AGE);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest req = loadAuthorizationRequest(request);
        eraseCookie(response);
        return req;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Optional<Cookie> findCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return Optional.empty();
        return Arrays.stream(cookies).filter(c -> name.equals(c.getName())).findFirst();
    }

    private void writeCookie(HttpServletResponse response, String name, String value, int maxAge) {
        // Build Set-Cookie manually to include SameSite=Lax (Servlet 6.0 doesn't expose it via API)
        String header = name + "=" + value
                + "; Path=/"
                + "; HttpOnly"
                + "; Secure"
                + "; Max-Age=" + maxAge
                + "; SameSite=Lax";
        response.addHeader("Set-Cookie", header);
    }

    private void eraseCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                COOKIE_NAME + "=; Path=/; HttpOnly; Secure; Max-Age=0");
    }

    private String serialize(OAuth2AuthorizationRequest req) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(req);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Cannot serialize OAuth2AuthorizationRequest", e);
        }
    }

    private OAuth2AuthorizationRequest deserialize(Cookie cookie) {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(
                     Base64.getUrlDecoder().decode(cookie.getValue()));
             ObjectInputStream ois = new ObjectInputStream(bais)) {
            return (OAuth2AuthorizationRequest) ois.readObject();
        } catch (Exception e) {
            return null;
        }
    }
}
