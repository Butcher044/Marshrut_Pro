<div align="center">

# 🚛 Маршруты Про

### Платформа управления грузовыми перевозками

*Умная маршрутизация · Реальные данные · Полный контроль*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-marshrutpro.ru-2563EB?style=for-the-badge)](https://marshrutpro.ru)

<br/>

![Java](https://img.shields.io/badge/Java_17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.1-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_+_PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis_7.2-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)

</div>

---

## 📋 Содержание

1. [О проекте](#-о-проекте)
2. [Технологический стек](#-технологический-стек)
3. [Архитектура системы](#-архитектура-системы)
4. [Микросервисы](#-микросервисы)
5. [База данных](#-база-данных)
6. [Ролевая модель](#-ролевая-модель-rbac)
7. [Redis — кеширование](#-redis--кеширование)
8. [Запуск проекта](#-запуск-проекта)
9. [Переменные окружения](#-переменные-окружения)
10. [API Reference](#-api-reference)

---

## 🎯 О проекте

**Маршруты Про** — полнофункциональная платформа для управления транспортной компанией: от приёма заявок до автоматического построения маршрутов и отслеживания рейсов в реальном времени.

<br/>

<table>
<tr>
<td width="50%">

### ✨ Возможности

| | Функция | Описание |
|---|---|---|
| 📦 | **Заказы** | Создание, назначение, отслеживание статуса перевозок |
| 🤖 | **Авто-назначение** | Ближайший свободный водитель через PostGIS |
| 🗺️ | **Маршруты** | Яндекс Routing API — дистанция, время, путевые точки |
| 📍 | **Геокодирование** | Адреса → координаты через Яндекс Geocoder |
| 📡 | **GPS-трекинг** | Логирование координат водителей в реальном времени |
| 🔐 | **Авторизация** | Email/пароль + OAuth2 через Яндекс ID |
| 🗾 | **Интерактивная карта** | Маршруты и водители на Яндекс Картах v2.1 |
| 📊 | **Аналитика** | Дашборды по заказам, водителям и флоту |

</td>
<td width="50%">

### 👥 Роли пользователей

| Роль | Описание |
|---|---|
| 👑 **ADMIN** | Полный доступ: все сущности и пользователи |
| 📋 **MANAGER** | Заказы, водители, транспорт |
| 🚛 **DRIVER** | Свои рейсы, обновление геолокации |
| 📦 **CLIENT** | Создание заказов, отслеживание |

</td>
</tr>
</table>

---

## 🛠 Технологический стек

<table>
<tr>
<td width="50%">

### ⚙️ Backend

| Технология | Версия |
|---|---|
| Java | 17 |
| Spring Boot | 3.1.x |
| Spring Cloud (Netflix OSS) | 2022.0.x |
| Netflix Eureka (Service Discovery) | — |
| Spring Cloud Gateway (WebFlux) | — |
| Spring Security + JWT (JJWT) | 0.11.5 |
| Spring Security OAuth2 Client | — |
| Spring Data JPA + Hibernate Spatial | — |
| PostgreSQL + PostGIS | 15 / 3.3 |
| Redis | 7.2 |
| OpenFeign | — |
| Spring RestClient | — |
| Maven (multi-module) | — |

</td>
<td width="50%">

### 🎨 Frontend

| Технология | Версия |
|---|---|
| React | 18.3 |
| Vite | 5.3 |
| Tailwind CSS | 3.4 |
| React Router | 6.24 |
| Zustand | 4.5 |
| Axios (с interceptors) | 1.7 |
| Framer Motion | 11.3 |
| Recharts | 2.12 |
| Lucide React | 0.414 |
| Яндекс Карты JS API | 2.1 |
| Nginx | 1.25 |

</td>
</tr>
</table>

> 🏗️ **Инфраструктура:** Docker Compose · PostGIS (`ST_DWithin`, GIST-индексы) · Партиционированные таблицы для GPS-логов

---

## 🏛 Архитектура системы

Система построена по принципу **микросервисной архитектуры**. Все сервисы регистрируются в Eureka, взаимодействуют через API Gateway, а общий код вынесен в библиотеку `tms-common-lib`.

```mermaid
graph TB
    Browser["🌐 Браузер\n(React SPA)"]
    
    subgraph Docker Network
        FE["📦 Frontend\nNginx :3000"]
        GW["🔀 API Gateway\nSpring Cloud Gateway :8080"]
        EU["🗂️ Eureka Server\nService Discovery :8761"]
        
        subgraph Services
            AU["🔐 Auth Service\n:8081"]
            CO["📋 Core Service\n:8082"]
            RO["🗺️ Routing Service\n:8083"]
        end
        
        subgraph Storage
            PG[("🐘 PostgreSQL\n+ PostGIS :5432")]
            RD[("⚡ Redis\n:6379")]
        end
    end
    
    subgraph External APIs
        YM["🗺️ Яндекс Карты\nMaps JS API v2.1"]
        YG["📍 Яндекс Geocoder\nREST API"]
        YR["🛣️ Яндекс Routing\nAPI v2"]
        YO["👤 Яндекс OAuth2\noauth.yandex.ru"]
    end

    Browser -->|"HTTP :3000"| FE
    FE -->|"/api/* proxy"| GW
    GW -->|"lb://tms-auth-service"| AU
    GW -->|"lb://tms-core-service"| CO
    GW -->|"lb://tms-routing-service"| RO
    
    AU & CO & RO -->|"Register / Heartbeat"| EU
    GW -->|"Route discovery"| EU
    
    AU --> PG & RD
    CO --> PG & RD
    RO --> PG & RD
    
    CO -->|"OpenFeign"| RO
    
    Browser -->|"Карты"| YM
    AU -->|"OAuth2"| YO
    RO -->|"Geocoding"| YG
    RO -->|"Routing"| YR
```

### 🔄 Поток запроса через систему

```mermaid
sequenceDiagram
    actor User as Пользователь
    participant FE as Frontend (Nginx)
    participant GW as API Gateway
    participant AU as Auth Service
    participant RD as Redis
    participant SVC as Core / Routing Service

    User->>FE: GET http://localhost:3000
    Note over FE: SPA — отдаёт index.html

    User->>FE: POST /api/auth/login
    FE->>GW: проксирует (публичный путь, без JWT)
    GW->>AU: POST /api/auth/login
    AU->>AU: BCrypt verify
    AU->>RD: SET refresh:{userId}:{uuid} TTL 7d
    AU-->>GW: {accessToken, refreshToken}
    GW-->>FE: 200 OK
    FE->>FE: сохраняет токены в Zustand store

    User->>FE: GET /api/orders
    FE->>GW: Authorization: Bearer <accessToken>
    GW->>GW: JwtAuthFilter: validateAccessToken()
    GW->>RD: EXISTS blacklist:{jti}
    RD-->>GW: false
    GW->>GW: mutate request + X-User-Id, X-User-Email, X-User-Role
    GW->>SVC: GET /api/orders (с заголовками)
    SVC->>SVC: GatewayHeaderAuthFilter → SecurityContext
    SVC->>SVC: @PreAuthorize check
    SVC-->>GW: 200 [{orders}]
    GW-->>FE: 200 [{orders}]
```

---

## 🔌 Микросервисы

### 🗂️ Eureka Server — Service Discovery

**Порт:** `8761`

Центральный реестр сервисов. Все микросервисы при старте регистрируются здесь и обновляют статус каждые 30 секунд. Gateway использует Eureka для балансировки нагрузки (`lb://`).

```mermaid
graph LR
    EU["🗂️ Eureka Server\n:8761"]
    AU["Auth Service\n:8081"] -->|"Register / Heartbeat"| EU
    CO["Core Service\n:8082"] -->|"Register / Heartbeat"| EU
    RO["Routing Service\n:8083"] -->|"Register / Heartbeat"| EU
    GW["API Gateway\n:8080"] -->|"Fetch Registry\nResolve lb://"| EU
```

> 📊 **Dashboard:** `http://localhost:8761` — визуальный реестр всех зарегистрированных экземпляров

---

### 🔀 API Gateway

**Порт:** `8080` · **Технология:** Spring Cloud Gateway (реактивный, WebFlux)

Единая точка входа. Валидирует JWT, проверяет Redis-blacklist и проксирует запросы.

#### Таблица маршрутов

| Путь | Сервис | Доступ |
|---|---|:---:|
| `POST /api/auth/login` | tms-auth-service | 🟢 Public |
| `POST /api/auth/register` | tms-auth-service | 🟢 Public |
| `POST /api/auth/refresh` | tms-auth-service | 🟢 Public |
| `/api/auth/**` | tms-auth-service | 🔒 JWT |
| `/oauth2/**`, `/login/oauth2/**` | tms-auth-service | 🟢 Public |
| `/api/orders/**` | tms-core-service | 🔒 JWT |
| `/api/drivers/**` | tms-core-service | 🔒 JWT |
| `/api/vehicles/**` | tms-core-service | 🔒 JWT |
| `/api/stats/**` | tms-core-service | 🔒 JWT |
| `/api/routes/**` | tms-routing-service | 🔒 JWT |

#### Работа JWT-фильтра

```mermaid
flowchart TD
    REQ["Входящий запрос"] --> PUB{Публичный\nпуть?}
    PUB -->|Да| PASS["Пропустить\nбез проверки"]
    PUB -->|Нет| HDR{Authorization:\nBearer present?}
    HDR -->|Нет| R401A["401 Unauthorized"]
    HDR -->|Да| VAL{validateAccessToken}
    VAL -->|Невалидный| R401B["401 Unauthorized"]
    VAL -->|Валидный| BL{Redis:\nblacklist:jti ?}
    BL -->|EXISTS| R401C["401 Unauthorized"]
    BL -->|NOT EXISTS| MUT["Добавить заголовки:\nX-User-Id\nX-User-Email\nX-User-Role"]
    MUT --> FWD["Проксировать\nв сервис"]
    PASS --> FWD
```

После успешной валидации в запрос добавляются заголовки, которые downstream-сервисы используют для авторизации:

```
X-User-Id:    42
X-User-Email: user@example.com
X-User-Role:  MANAGER
```

---

### 🔐 Auth Service — Аутентификация

**Порт:** `8081` · **БД:** таблица `users`

Управление пользователями, выдача JWT-токенов, OAuth2 через Яндекс.

#### Полный поток аутентификации

```mermaid
sequenceDiagram
    participant C as Client
    participant AU as Auth Service
    participant DB as PostgreSQL
    participant RD as Redis

    rect rgb(230, 245, 255)
        Note over C,RD: Регистрация / Логин
        C->>AU: POST /api/auth/register {email, password, firstName, lastName}
        AU->>DB: SELECT * FROM users WHERE email=?
        DB-->>AU: (пусто)
        AU->>AU: BCrypt.hash(password, strength=12)
        AU->>DB: INSERT INTO users (role='CLIENT')
        AU->>AU: generateAccessToken(userId, email, role)
        AU->>AU: generateRefreshToken() → UUID
        AU->>RD: SET refresh:{userId}:{uuid} = userId  TTL 7d
        AU-->>C: {accessToken, refreshToken}
    end

    rect rgb(230, 255, 230)
        Note over C,RD: Обновление токена
        C->>AU: POST /api/auth/refresh {refreshToken}
        AU->>RD: GET refresh:{userId}:{uuid}
        RD-->>AU: userId
        AU->>AU: generateAccessToken (новый)
        AU->>AU: generateRefreshToken (новый UUID)
        AU->>RD: DEL старый refresh, SET новый  TTL 7d
        AU-->>C: {accessToken, refreshToken}
    end

    rect rgb(255, 245, 230)
        Note over C,RD: Логаут
        C->>AU: POST /api/auth/logout {refreshToken}
        AU->>RD: DEL refresh:{userId}:{uuid}
        AU->>AU: extractJti(accessToken) + оставшееся время жизни
        AU->>RD: SET blacklist:{jti} = "1"  TTL = remaining
        AU-->>C: 200 OK
    end
```

#### OAuth2 — Яндекс ID

```mermaid
sequenceDiagram
    actor U as Пользователь
    participant FE as Frontend
    participant GW as Gateway
    participant AU as Auth Service
    participant YA as Яндекс OAuth2

    U->>FE: Нажимает "Войти через Яндекс"
    FE->>GW: GET /oauth2/authorization/yandex
    GW->>AU: redirect
    AU->>YA: redirect_uri, client_id, scope
    YA->>U: Страница авторизации Яндекс
    U->>YA: Подтверждает доступ
    YA->>AU: callback + authorization_code
    AU->>YA: POST /token → access_token
    AU->>YA: GET /info → {id, login, emails}
    AU->>AU: UPSERT users SET yandex_id WHERE yandex_id=id
    AU->>AU: generateAccessToken + generateRefreshToken
    AU->>FE: redirect /oauth2/callback?token=JWT&refresh=UUID
    FE->>FE: Сохраняет токены → redirect /dashboard
```

#### Структура JWT токена

```
Header  → { "alg": "HS256", "typ": "JWT" }

Payload → {
  "sub":   "42",              ← userId
  "email": "user@mail.ru",
  "role":  "MANAGER",
  "jti":   "uuid-v4",        ← уникальный ID для blacklist
  "iat":   1714500000,
  "exp":   1714500900         ← +15 минут
}
```

#### Endpoints

| Метод | Путь | Доступ | Описание |
|:---:|---|:---:|---|
| `POST` | `/api/auth/register` | 🟢 Public | Регистрация |
| `POST` | `/api/auth/login` | 🟢 Public | Логин |
| `POST` | `/api/auth/refresh` | 🟢 Public | Обновить токен |
| `POST` | `/api/auth/logout` | 🔒 JWT | Выйти |
| `GET` | `/api/auth/me` | 🔒 JWT | Текущий пользователь |
| `GET` | `/api/auth/admin/users` | 👑 ADMIN | Список пользователей |
| `POST` | `/api/auth/admin/users` | 👑 ADMIN | Создать пользователя |
| `DELETE` | `/api/auth/admin/users/{id}` | 👑 ADMIN | Удалить пользователя |

---

### 📋 Core Service — Бизнес-логика

**Порт:** `8082` · **БД:** `orders`, `drivers`, `vehicles`, `locations_log`

Управление заказами, водителями, транспортом. Автоматическое назначение водителя с геопоиском через PostGIS.

#### Логика назначения водителя

```mermaid
flowchart TD
    A["POST /api/orders/{id}/assign"] --> B{Статус заказа\n= PENDING?}
    B -->|Нет| ERR1["400 Bad Request"]
    B -->|Да| C{origin_location\nесть в БД?}
    C -->|Нет| GEO["Геокодировать адрес\n← Routing Service"]
    GEO --> D{Получили\nкоординаты?}
    D -->|Нет| ERR2["400: геокодирование\nнедоступно"]
    D -->|Да| E
    C -->|Да| E["ST_DWithin(origin, driver.location, 50km)\nORDER BY distance\nLIMIT 1"]
    E --> F{Свободный\nводитель найден?}
    F -->|Нет| ERR3["400: нет водителей\nв радиусе 50 км"]
    F -->|Да| G["order.driverId = driver.id\norder.status = ASSIGNED"]
    G --> H["Построить маршрут\n← Routing Service (Feign)"]
    H --> I["driver.status = ON_TRIP"]
    I --> J["200 OK: OrderDto"]
```

#### Авторизация через заголовки Gateway

```java
// GatewayHeaderAuthFilter.java
String role = request.getHeader("X-User-Role"); // "MANAGER"
new SimpleGrantedAuthority("ROLE_" + role);      // → "ROLE_MANAGER"
// Теперь @PreAuthorize("hasRole('MANAGER')") работает
```

#### Endpoints

| Метод | Путь | Роли | Описание |
|:---:|---|---|---|
| `POST` | `/api/orders` | ADMIN, MANAGER, CLIENT | Создать заказ |
| `GET` | `/api/orders` | ADMIN, MANAGER | Все заказы |
| `GET` | `/api/orders/my` | CLIENT, DRIVER | Свои заказы |
| `GET` | `/api/orders/{id}` | Authenticated | Заказ по ID |
| `PATCH` | `/api/orders/{id}/status` | ADMIN, MANAGER, DRIVER | Обновить статус |
| `POST` | `/api/orders/{id}/assign` | ADMIN, MANAGER | Назначить водителя |
| `DELETE` | `/api/orders/{id}` | ADMIN, MANAGER | Удалить заказ |
| `GET` | `/api/drivers` | ADMIN, MANAGER | Все водители |
| `POST` | `/api/drivers` | ADMIN | Создать профиль водителя |
| `PATCH` | `/api/drivers/{id}/status` | ADMIN, MANAGER | Статус водителя |
| `POST` | `/api/drivers/{id}/location` | DRIVER | Обновить геолокацию |
| `GET` | `/api/vehicles` | ADMIN, MANAGER | Транспорт |
| `POST` | `/api/vehicles` | ADMIN | Создать ТС |
| `PUT` | `/api/vehicles/{id}` | ADMIN | Обновить ТС |
| `DELETE` | `/api/vehicles/{id}` | ADMIN | Удалить ТС |
| `GET` | `/api/stats/summary` | ADMIN, MANAGER | Сводная статистика |

---

### 🗺️ Routing Service — Маршрутизация

**Порт:** `8083` · **БД:** `routes`, `route_points`

Геокодирование адресов, построение маршрутов через Яндекс API, кеширование в Redis.

```mermaid
sequenceDiagram
    participant CO as Core Service (Feign)
    participant RO as Routing Service
    participant RD as Redis
    participant YG as Яндекс Geocoder
    participant YR as Яндекс Routing API

    CO->>RO: POST /api/routes/build\n{orderId, originAddress, destAddress, cargoWeight}
    
    RO->>RD: GET geocode:{originAddress}
    alt Кеш есть
        RD-->>RO: {lat, lon}
    else Кеш промах
        RO->>YG: GET /1.x?geocode={address}
        YG-->>RO: {Point.pos}
        RO->>RD: SET geocode:{address} TTL 24h
    end

    RO->>YR: GET /v2/route?waypoints=origin,dest&mode=truck
    YR-->>RO: {distance_km, duration_min, polyline_points}
    
    RO->>RO: Сохранить Route + RoutePoints в PostgreSQL
    RO-->>CO: RouteDto {totalKm, durationMin, routePoints[]}
```

#### Endpoints

| Метод | Путь | Описание |
|:---:|---|---|
| `POST` | `/api/routes/build` | Построить маршрут для заказа |
| `GET` | `/api/routes/{orderId}` | Маршрут по ID заказа |
| `POST` | `/api/routes/geocode` | Геокодировать адрес → координаты |

---

### 🎨 Frontend — React + Vite

**Порт:** `3000` · Nginx отдаёт статику SPA и проксирует `/api/*` → Gateway.

#### Структура приложения

```
src/
├── 📁 api/           # Axios-клиенты (authApi, ordersApi, driversApi, routesApi)
├── 📁 components/    # Layout, Navbar, StatusBadge, RouteMap
├── 📁 pages/         # LandingPage, DashboardPage, OrdersPage...
├── 📁 router/        # AppRouter + PrivateRoute (RBAC)
└── 📁 store/         # Zustand: authStore, ordersStore
```

#### Механизм обновления токена (Axios interceptors)

```mermaid
sequenceDiagram
    participant C as Компонент React
    participant AX as Axios Instance
    participant GW as API Gateway
    participant AU as Auth Service

    C->>AX: GET /api/orders
    AX->>AX: request interceptor:\nAuthorization: Bearer <accessToken>
    AX->>GW: GET /api/orders (с токеном)
    GW-->>AX: 401 (токен истёк)
    
    AX->>AX: response interceptor:\nтокен истёк, ставим запрос в очередь
    AX->>AU: POST /api/auth/refresh {refreshToken}
    AU-->>AX: {accessToken: "new_token"}
    AX->>AX: сохранить в Zustand store
    AX->>AX: повторить все запросы из очереди
    AX->>GW: GET /api/orders (новый токен)
    GW-->>AX: 200 [{orders}]
    AX-->>C: данные получены
```

#### Маршруты и доступ

| Путь | Компонент | Роли |
|---|---|---|
| `/` | LandingPage | Все |
| `/login` | LoginPage | Все |
| `/register` | RegisterPage | Все |
| `/oauth2/callback` | OAuth2CallbackPage | Все |
| `/dashboard` | DashboardPage | Authenticated |
| `/orders` | OrdersPage | ADMIN, MANAGER, CLIENT, DRIVER |
| `/orders/:id` | OrderDetailPage | Authenticated |
| `/drivers` | DriversPage | ADMIN, MANAGER |
| `/vehicles` | VehiclesPage | ADMIN, MANAGER |
| `/map` | MapPage | Authenticated |
| `/admin/users` | UsersPage | ADMIN |
| `/admin/dispatchers` | UsersPage (MANAGER) | ADMIN |

---

## 🗄 База данных

Все сервисы используют одну базу **PostgreSQL 15 + PostGIS 3.3** (`tms_db`). Схема логически разделена по сервисам.

### Таблицы

| Таблица | Сервис | Назначение |
|---|---|---|
| `users` | Auth | Аккаунты пользователей |
| `vehicles` | Core | Транспортные средства |
| `drivers` | Core | Профили водителей |
| `orders` | Core | Заказы на перевозку |
| `routes` | Routing | Маршруты |
| `route_points` | Routing | Точки маршрута |
| `locations_log` | Core | История GPS-координат *(партиционирована по месяцам)* |

### ER-диаграмма

```mermaid
erDiagram
    users {
        bigserial id PK
        varchar email UK
        varchar password
        varchar first_name
        varchar last_name
        varchar role
        varchar yandex_id UK
        timestamp created_at
    }

    vehicles {
        bigserial id PK
        varchar plate_number UK
        varchar model
        varchar cargo_type
        numeric max_weight
        numeric max_volume
        varchar status
    }

    drivers {
        bigserial id PK
        bigint user_id UK
        bigint vehicle_id FK
        varchar license_no UK
        varchar status
    }

    orders {
        bigserial id PK
        bigint client_id
        bigint driver_id FK
        text origin_address
        text dest_address
        geometry origin_location
        geometry dest_location
        numeric cargo_weight
        numeric cargo_volume
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    routes {
        bigserial id PK
        bigint order_id UK_FK
        numeric total_km
        integer duration_min
        varchar status
        timestamp created_at
    }

    route_points {
        bigserial id PK
        bigint route_id FK
        integer seq_number
        text address
        geometry location
        varchar point_type
    }

    locations_log {
        bigserial id
        bigint driver_id
        geometry location
        timestamp recorded_at
    }

    users ||--o{ drivers : "user_id (логическая)"
    users ||--o{ orders : "client_id (логическая)"
    vehicles ||--o| drivers : "vehicle_id"
    drivers ||--o{ orders : "driver_id"
    orders ||--o| routes : "order_id"
    routes ||--o{ route_points : "route_id"
    drivers ||--o{ locations_log : "driver_id (логическая)"
```

> 💡 **Примечание:** Связи `users → drivers`, `users → orders`, `drivers → locations_log` — **логические** (без FK в БД). Это осознанное решение микросервисной архитектуры: `users` живёт в Auth Service, остальные таблицы — в Core Service.

---

## 🛡 Ролевая модель (RBAC)

```mermaid
graph TD
    subgraph Роли
        A["👑 ADMIN"]
        M["📋 MANAGER"]
        D["🚛 DRIVER"]
        C["📦 CLIENT"]
    end

    subgraph Возможности
        OU["Управление\nпользователями"]
        OA["Все заказы"]
        OM["Свои заказы"]
        DR["Список водителей"]
        DC["Создать профиль\nводителя"]
        DS["Статус водителя"]
        VH["Транспорт CRUD"]
        RT["Маршруты"]
        GL["GPS-геолокация"]
        ST["Статистика"]
    end

    A --> OU & OA & OM & DR & DC & DS & VH & RT & GL & ST
    M --> OA & DR & DS & VH & RT & ST
    D --> OM & GL & RT
    C --> OM & RT
```

### Матрица доступа к API

| Endpoint | 👑 ADMIN | 📋 MANAGER | 🚛 DRIVER | 📦 CLIENT |
|---|:---:|:---:|:---:|:---:|
| `POST /api/orders` | ✅ | ✅ | — | ✅ |
| `GET /api/orders` | ✅ | ✅ | — | — |
| `GET /api/orders/my` | — | — | ✅ | ✅ |
| `PATCH /api/orders/{id}/status` | ✅ | ✅ | ✅ | — |
| `POST /api/orders/{id}/assign` | ✅ | ✅ | — | — |
| `GET /api/drivers` | ✅ | ✅ | — | — |
| `POST /api/drivers` | ✅ | — | — | — |
| `POST /api/drivers/{id}/location` | — | — | ✅ | — |
| `GET /api/vehicles` | ✅ | ✅ | — | — |
| `POST/PUT/DELETE /api/vehicles` | ✅ | — | — | — |
| `GET /api/routes/{orderId}` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/stats/summary` | ✅ | ✅ | — | — |
| `GET /api/auth/admin/users` | ✅ | — | — | — |

---

## ⚡ Redis — Кеширование

| Назначение | Ключ | TTL | Сервис |
|---|---|:---:|---|
| 🔑 Refresh-токены | `refresh:{userId}:{uuid}` | 7 дней | Auth |
| 🚫 JWT-blacklist (logout) | `blacklist:{jti}` | Остаток жизни токена | Auth / Gateway |
| 📍 Кеш геокодирования | `geocode:{address}` | 24 часа | Routing |
| 🗺️ Кеш маршрутов | `route:{hash}` | 1 час | Routing |

### Демонстрация эффекта кеша

Первый запрос `GET /api/drivers` идёт в PostgreSQL (~150–200 мс), последующие отдаются из Redis (~5–15 мс):

```
Итерация  1 →  187 ms  ← холодный старт, запрос в БД
Итерация  2 →   23 ms  ← Redis hit
Итерация  3 →   11 ms
Итерация  4 →    9 ms
...
Итерация 50 →    7 ms  ← стабильный кеш
```

---

## 🚀 Запуск проекта

### Требования

- Docker Desktop 24+
- 4 GB RAM доступно для Docker

### Быстрый старт

```bash
# 1. Склонируйте репозиторий
git clone <repo-url>
cd Transport_company

# 2. Создайте файл переменных окружения
cp .env.example .env
# Заполните значения (см. раздел ниже)

# 3. Запустите все сервисы
docker compose up -d --build

# 4. Проверьте статус
docker compose ps
```

### Проверка готовности

| Сервис | URL | Ожидаемый результат |
|---|---|---|
| 🌐 Frontend | http://localhost:3000 | Лендинг Маршруты Про |
| 🗂️ Eureka Dashboard | http://localhost:8761 | Все 4 сервиса зарегистрированы |
| 🔀 Gateway Health | http://localhost:8080/actuator/health | `{"status":"UP"}` |
| 🔐 Auth Health | http://localhost:8081/actuator/health | `{"status":"UP"}` |

### Первый вход

```
Email:    admin@tms.ru
Пароль:   Admin@123
```

### Пересборка отдельного сервиса

```bash
# Пересобрать и перезапустить фронтенд
docker compose build frontend && docker compose up -d frontend

# Пересобрать core-service без кеша
docker compose build --no-cache core-service && docker compose up -d core-service
```

### Структура репозитория

```
Transport_company/
├── 📄 pom.xml                    # Maven parent POM
├── 📄 docker-compose.yml
├── 📄 init.sql                   # Схема БД + seed данные
├── 📄 .env                       # Переменные окружения (не коммитить!)
│
├── 📦 tms-common-lib/            # Общие DTO, исключения, JWT-утилиты
├── 🗂️ tms-eureka-server/         # Netflix Eureka (service discovery)
├── 🔀 tms-api-gateway/           # Spring Cloud Gateway + JWT-фильтр
├── 🔐 tms-auth-service/          # Регистрация, логин, Яндекс OAuth2
├── 📋 tms-core-service/          # Заказы, водители, транспорт
├── 🗺️ tms-routing-service/       # Яндекс Routing / Geocoder API
└── 🎨 tms-frontend/              # React + Vite + Tailwind CSS
```

---

## ⚙️ Переменные окружения

Создайте файл `.env` в корне проекта (используйте `.env.example` как шаблон):

```env
# ─── База данных ────────────────────────────────────
DB_PASSWORD=your_strong_password

# ─── Redis ──────────────────────────────────────────
REDIS_PASSWORD=your_redis_password

# ─── JWT (минимум 32 символа) ───────────────────────
JWT_SECRET=your_very_long_secret_key_minimum_32_chars

# ─── Яндекс OAuth2 ──────────────────────────────────
YANDEX_CLIENT_ID=your_yandex_oauth_client_id
YANDEX_CLIENT_SECRET=your_yandex_oauth_client_secret

# ─── Яндекс API ─────────────────────────────────────
YANDEX_GEOCODER_API_KEY=your_geocoder_api_key
VITE_YANDEX_MAPS_KEY=your_maps_js_api_key

# ─── Frontend URL (для OAuth2 callback) ─────────────
FRONTEND_URL=http://localhost:3000
```

> 🔑 Получить ключи Яндекс: [developer.tech.yandex.ru](https://developer.tech.yandex.ru)

---

## 📡 API Reference

### Аутентификация

```bash
# Регистрация
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.ru","password":"Pass123!","firstName":"Иван","lastName":"Иванов"}'

# Логин
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tms.ru","password":"Admin@123"}'

# Профиль текущего пользователя
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Выход
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Заказы

```bash
# Создать заказ
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "originAddress": "Москва, ул. Тверская, 1",
    "destAddress": "Санкт-Петербург, Невский пр., 1",
    "cargoWeight": 1500,
    "cargoVolume": 10
  }'

# Автоматически назначить водителя
curl -X POST http://localhost:8080/api/orders/1/assign \
  -H "Authorization: Bearer <token>"

# Обновить статус
curl -X PATCH http://localhost:8080/api/orders/1/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### Водители

```bash
# Создать профиль водителя
curl -X POST http://localhost:8080/api/drivers \
  -H "Authorization: Bearer <adminToken>" \
  -H "Content-Type: application/json" \
  -d '{"userId": 3, "licenseNo": "77 АА 123456"}'

# Обновить геолокацию (от имени водителя)
curl -X POST http://localhost:8080/api/drivers/1/location \
  -H "Authorization: Bearer <driverToken>" \
  -H "Content-Type: application/json" \
  -d '{"lat": 55.7558, "lon": 37.6173}'
```

### Маршруты и геокодирование

```bash
# Получить маршрут заказа
curl http://localhost:8080/api/routes/1 \
  -H "Authorization: Bearer <token>"

# Геокодировать адрес
curl -X POST http://localhost:8080/api/routes/geocode \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"address": "Москва, Красная площадь"}'
```

---

<div align="center">

Дипломная работа · Гизатулин Никита · 2025

</div>
