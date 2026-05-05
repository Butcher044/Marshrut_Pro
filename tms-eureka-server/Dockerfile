FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Copy ALL module pom.xml stubs so Maven can resolve the multi-module parent
COPY pom.xml ./pom.xml
COPY tms-common-lib/pom.xml ./tms-common-lib/pom.xml
COPY tms-eureka-server/pom.xml ./tms-eureka-server/pom.xml
COPY tms-api-gateway/pom.xml ./tms-api-gateway/pom.xml
COPY tms-auth-service/pom.xml ./tms-auth-service/pom.xml
COPY tms-core-service/pom.xml ./tms-core-service/pom.xml
COPY tms-routing-service/pom.xml ./tms-routing-service/pom.xml

# Copy only the sources needed for this service
COPY tms-common-lib/src ./tms-common-lib/src
COPY tms-eureka-server/src ./tms-eureka-server/src

RUN mvn install -pl tms-common-lib,tms-eureka-server -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/tms-eureka-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
