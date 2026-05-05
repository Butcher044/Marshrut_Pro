package ru.tms.core.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.tms.common.dto.VehicleDto;
import ru.tms.common.exception.BusinessException;
import ru.tms.common.exception.ResourceNotFoundException;
import ru.tms.core.entity.Vehicle;
import ru.tms.core.repository.VehicleRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public List<VehicleDto> getAll() {
        return vehicleRepository.findAll().stream().map(this::toDto).toList();
    }

    public VehicleDto getById(Long id) {
        return toDto(vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id)));
    }

    @Transactional
    public VehicleDto create(VehicleDto dto) {
        if (vehicleRepository.existsByPlateNumber(dto.getPlateNumber())) {
            throw new BusinessException("Vehicle with plate " + dto.getPlateNumber() + " already exists");
        }
        Vehicle vehicle = Vehicle.builder()
                .plateNumber(dto.getPlateNumber())
                .model(dto.getModel())
                .cargoType(dto.getCargoType())
                .maxWeight(dto.getMaxWeight())
                .maxVolume(dto.getMaxVolume())
                .status("AVAILABLE")
                .build();
        return toDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleDto update(Long id, VehicleDto dto) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        vehicle.setModel(dto.getModel());
        vehicle.setCargoType(dto.getCargoType());
        vehicle.setMaxWeight(dto.getMaxWeight());
        vehicle.setMaxVolume(dto.getMaxVolume());
        if (dto.getStatus() != null) vehicle.setStatus(dto.getStatus());
        return toDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void delete(Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vehicle", id);
        }
        vehicleRepository.deleteById(id);
    }

    private VehicleDto toDto(Vehicle v) {
        return VehicleDto.builder()
                .id(v.getId())
                .plateNumber(v.getPlateNumber())
                .model(v.getModel())
                .cargoType(v.getCargoType())
                .maxWeight(v.getMaxWeight())
                .maxVolume(v.getMaxVolume())
                .status(v.getStatus())
                .build();
    }
}
