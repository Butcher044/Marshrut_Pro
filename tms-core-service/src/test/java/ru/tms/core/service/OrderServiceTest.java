package ru.tms.core.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import ru.tms.common.dto.OrderCreateDto;
import ru.tms.common.dto.OrderDto;
import ru.tms.common.exception.BusinessException;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.core.client.RoutingServiceClient;
import ru.tms.core.entity.Order;
import ru.tms.core.repository.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private DriverService driverService;
    @Mock
    private RoutingServiceClient routingServiceClient;

    @InjectMocks
    private OrderService orderService;

    private Order buildOrder(Long id, String status) {
        Order o = new Order();
        o.setId(id);
        o.setClientId(100L);
        o.setOriginAddress("Moscow, Kremlin");
        o.setDestAddress("Saint Petersburg, Palace Sq");
        o.setCargoWeight(BigDecimal.valueOf(500));
        o.setCargoVolume(BigDecimal.valueOf(2));
        o.setStatus(status);
        o.setCreatedAt(LocalDateTime.now());
        o.setUpdatedAt(LocalDateTime.now());
        return o;
    }

    @Test
    void create_savesAndReturnsDto() {
        OrderCreateDto dto = new OrderCreateDto();
        dto.setOriginAddress("A");
        dto.setDestAddress("B");
        dto.setCargoWeight(BigDecimal.TEN);
        dto.setCargoVolume(BigDecimal.ONE);

        Order saved = buildOrder(1L, "PENDING");
        when(orderRepository.save(any())).thenReturn(saved);

        OrderDto result = orderService.create(dto, 100L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getClientId()).isEqualTo(100L);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void getById_existingOrder_returnsDto() {
        Order order = buildOrder(5L, "PENDING");
        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));

        OrderDto result = orderService.getById(5L);

        assertThat(result.getId()).isEqualTo(5L);
    }

    @Test
    void getById_notFound_throwsResourceNotFoundException() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAll_withStatus_filtersCorrectly() {
        Order order = buildOrder(1L, "PENDING");
        Page<Order> page = new PageImpl<>(List.of(order));
        when(orderRepository.findByStatus(eq("PENDING"), any())).thenReturn(page);

        Page<OrderDto> result = orderService.getAll("PENDING", PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo("PENDING");
    }

    @Test
    void getAll_withoutStatus_returnsAll() {
        Page<Order> page = new PageImpl<>(List.of(buildOrder(1L, "PENDING"), buildOrder(2L, "DELIVERED")));
        when(orderRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        Page<OrderDto> result = orderService.getAll(null, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    void updateStatus_changesAndReturns() {
        Order order = buildOrder(3L, "PENDING");
        when(orderRepository.findById(3L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderDto result = orderService.updateStatus(3L, "IN_PROGRESS");

        assertThat(result.getStatus()).isEqualTo("IN_PROGRESS");
    }

    @Test
    void delete_pendingOrder_deletesSuccessfully() {
        Order order = buildOrder(4L, "PENDING");
        when(orderRepository.findById(4L)).thenReturn(Optional.of(order));

        orderService.delete(4L);

        verify(orderRepository).deleteById(4L);
    }

    @Test
    void delete_inProgressOrder_throwsBusinessException() {
        Order order = buildOrder(6L, "IN_PROGRESS");
        when(orderRepository.findById(6L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.delete(6L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDING or CANCELLED");
    }

    @Test
    void assignDriver_notPending_throwsBusinessException() {
        Order order = buildOrder(7L, "ASSIGNED");
        when(orderRepository.findById(7L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.assignDriver(7L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDING status");
    }

    @Test
    void assignDriver_noCoordinates_throwsBusinessException() {
        Order order = buildOrder(8L, "PENDING");
        // originLocation is null by default
        when(orderRepository.findById(8L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.assignDriver(8L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("origin coordinates");
    }
}
