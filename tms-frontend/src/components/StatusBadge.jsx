const STATUS_CONFIG = {
  PENDING:     { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', label: 'Ожидание' },
  ASSIGNED:    { dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', label: 'Назначен' },
  IN_PROGRESS: { dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', label: 'В пути' },
  DELIVERED:   { dot: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Доставлен' },
  CANCELLED:   { dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'Отменён' },
  AVAILABLE:   { dot: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Свободен' },
  ON_TRIP:     { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', label: 'На рейсе' },
  OFF_DUTY:    { dot: '#6B7280', bg: '#F3F4F6', text: '#374151', label: 'Не в смене' },
  IN_USE:      { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E', label: 'Используется' },
  MAINTENANCE: { dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'Ремонт' },
  PLANNED:     { dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', label: 'Запланирован' },
  ACTIVE:      { dot: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Активен' },
  COMPLETED:   { dot: '#10B981', bg: '#ECFDF5', text: '#065F46', label: 'Выполнен' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { dot: '#6B7280', bg: '#F3F4F6', text: '#374151', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px 3px 8px', borderRadius: 20,
      background: cfg.bg, color: cfg.text,
      fontSize: '0.72rem', fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}
