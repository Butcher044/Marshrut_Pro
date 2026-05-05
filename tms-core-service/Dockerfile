FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml ./pom.xml
COPY tms-common-lib/pom.xml ./tms-common-lib/pom.xml
COPY tms-eureka-server/pom.xml ./tms-eureka-server/pom.xml
COPY tms-api-gateway/pom.xml ./tms-api-gateway/pom.xml
COPY tms-auth-service/pom.xml ./tms-auth-service/pom.xml
COPY tms-core-service/pom.xml ./tms-core-service/pom.xml
COPY tms-routing-service/pom.xml ./tms-routing-service/pom.xml

COPY tms-common-lib/src ./tms-common-lib/src
COPY tms-core-service/src ./tms-core-service/src

RUN mvn install -pl tms-common-lib,tms-core-service -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/tms-core-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
