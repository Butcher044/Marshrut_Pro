package ru.tms.routing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"ru.tms.routing", "ru.tms.common"})
public class RoutingServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RoutingServiceApplication.class, args);
    }
}
