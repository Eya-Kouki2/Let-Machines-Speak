import { buildMachineHealthViewModel, mockMachines } from './machineHealth.mock'
import type { MachineHealthDataSource, MachineHealthStatus } from '../types/machineHealth'

export const machineHealthMockService: MachineHealthDataSource = {
  async getMachines() {
    return mockMachines
  },

  async getMachineHealth(machineId: string, scenario: MachineHealthStatus = 'red') {
    return buildMachineHealthViewModel(machineId, scenario)
  },
}
