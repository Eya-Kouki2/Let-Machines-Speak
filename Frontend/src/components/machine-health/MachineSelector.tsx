import type { Machine } from '../../types/machineHealth'

interface MachineSelectorProps {
  machines: Machine[]
  selectedMachineId: string
  onChange: (machineId: string) => void
}

export function MachineSelector({ machines, selectedMachineId, onChange }: MachineSelectorProps) {
  return (
    <label className="mh-selector-label">
      <span>Machine</span>
      <select className="mh-machine-select" value={selectedMachineId} onChange={(event) => onChange(event.target.value)}>
        {machines.map((machine) => (
          <option key={machine.id} value={machine.id}>
            {machine.name}
          </option>
        ))}
      </select>
    </label>
  )
}
