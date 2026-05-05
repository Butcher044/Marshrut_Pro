-- TMS Database Initialization Script
-- Requires PostgreSQL + PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- USERS (managed by tms-auth-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255),
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'CLIENT',
    yandex_id   VARCHAR(255) UNIQUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VEHICLES (managed by tms-core-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id           BIGSERIAL PRIMARY KEY,
    plate_number VARCHAR(20)   NOT NULL UNIQUE,
    model        VARCHAR(100)  NOT NULL,
    cargo_type   VARCHAR(50),
    max_weight   NUMERIC(10,2),
    max_volume   NUMERIC(10,2),
    status       VARCHAR(50)   NOT NULL DEFAULT 'AVAILABLE'
    -- Statuses: AVAILABLE, IN_USE, MAINTENANCE
);

-- ============================================================
-- DRIVERS (managed by tms-core-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL UNIQUE,
    vehicle_id  BIGINT        REFERENCES vehicles(id) ON DELETE SET NULL,
    license_no  VARCHAR(50)   NOT NULL UNIQUE,
    status      VARCHAR(50)   NOT NULL DEFAULT 'AVAILABLE'
    -- Statuses: AVAILABLE, ON_TRIP, OFF_DUTY
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers (status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers (user_id);

-- ============================================================
-- ORDERS (managed by tms-core-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id               BIGSERIAL PRIMARY KEY,
    client_id        BIGINT        NOT NULL,
    driver_id        BIGINT        REFERENCES drivers(id) ON DELETE SET NULL,
    origin_address   TEXT          NOT NULL,
    dest_address     TEXT          NOT NULL,
    origin_location  geometry(Point, 4326),
    dest_location    geometry(Point, 4326),
    cargo_weight     NUMERIC(10,2),
    cargo_volume     NUMERIC(10,2),
    status           VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    -- Statuses: PENDING, ASSIGNED, IN_PROGRESS, DELIVERED, CANCELLED
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders (driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_origin_location ON orders USING GIST (origin_location);
CREATE INDEX IF NOT EXISTS idx_orders_dest_location ON orders USING GIST (dest_location);

-- ============================================================
-- ROUTES (managed by tms-routing-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT        NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    total_km     NUMERIC(10,2),
    duration_min INTEGER,
    status       VARCHAR(50)   NOT NULL DEFAULT 'PLANNED',
    -- Statuses: PLANNED, ACTIVE, COMPLETED
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_order_id ON routes (order_id);

-- ============================================================
-- ROUTE POINTS (managed by tms-routing-service)
-- ============================================================
CREATE TABLE IF NOT EXISTS route_points (
    id          BIGSERIAL PRIMARY KEY,
    route_id    BIGINT        NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    seq_number  INTEGER       NOT NULL,
    address     TEXT          NOT NULL,
    location    geometry(Point, 4326),
    point_type  VARCHAR(50)   NOT NULL
    -- Types: ORIGIN, WAYPOINT, DESTINATION
);

CREATE INDEX IF NOT EXISTS idx_route_points_route_id ON route_points (route_id);
CREATE INDEX IF NOT EXISTS idx_route_points_location ON route_points USING GIST (location);

-- ============================================================
-- LOCATIONS LOG (managed by tms-core-service, partitioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations_log (
    id          BIGSERIAL     NOT NULL,
    driver_id   BIGINT        NOT NULL,
    location    geometry(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP     NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions for 2025
CREATE TABLE IF NOT EXISTS locations_log_2025_01 PARTITION OF locations_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_02 PARTITION OF locations_log
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_03 PARTITION OF locations_log
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_04 PARTITION OF locations_log
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_05 PARTITION OF locations_log
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_06 PARTITION OF locations_log
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_07 PARTITION OF locations_log
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_08 PARTITION OF locations_log
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_09 PARTITION OF locations_log
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_10 PARTITION OF locations_log
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_11 PARTITION OF locations_log
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE IF NOT EXISTS locations_log_2025_12 PARTITION OF locations_log
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Monthly partitions for 2026
CREATE TABLE IF NOT EXISTS locations_log_2026_01 PARTITION OF locations_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_02 PARTITION OF locations_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_03 PARTITION OF locations_log
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_04 PARTITION OF locations_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_05 PARTITION OF locations_log
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_06 PARTITION OF locations_log
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_07 PARTITION OF locations_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_08 PARTITION OF locations_log
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_09 PARTITION OF locations_log
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_10 PARTITION OF locations_log
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_11 PARTITION OF locations_log
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS locations_log_2026_12 PARTITION OF locations_log
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Spatial index on locations_log (applies to all partitions)
CREATE INDEX IF NOT EXISTS idx_locations_log_location ON locations_log USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_locations_log_driver_id ON locations_log (driver_id);
CREATE INDEX IF NOT EXISTS idx_locations_log_recorded_at ON locations_log (recorded_at);

-- ============================================================
-- Seed default admin user (password: Admin@123)
-- BCrypt hash of 'Admin@123'
-- ============================================================
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('admin@tms.ru', '$2b$12$K6.VsswtLC9ibrc2l8jHsuE6FhBVeQlzZ5z0CrgtRrhN//FFL5uCS', 'Admin', 'TMS', 'ADMIN')
ON CONFLICT (email) DO NOTHING;
