import type { Machine, MachineHealthSnapshot } from '../../types/machineHealth'

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

export function MachineDetails({ machine, snapshot }: { machine: Machine; snapshot: MachineHealthSnapshot }) {
  const details = [
    ['Machine ID', machine.machineId],
    ['Zone', machine.zone],
    ['Sensor Stream', machine.connected ? 'Connected' : 'Offline'],
    ['AI Service', 'Available'],
    ['Sampling rate', machine.samplingRate],
    ['Last update', formatTimestamp(snapshot.timestamp)],
  ]

  return (
    <article className="mh-card mh-details-card">
      <h2>Machine Details</h2>
      <div className="mh-detail-grid">
        {details.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}
