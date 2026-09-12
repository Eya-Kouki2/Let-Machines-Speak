import { jsPDF } from 'jspdf'
import type { Machine, MachineAlert, MachineMetric, MachineHealthSnapshot } from '../types/machineHealth'
import type { SafetyEventRow } from '../pages/worker-safety/types'

const addSectionDivider = (doc: jsPDF, y: number) => {
  doc.setDrawColor(16, 185, 129)
  doc.setLineWidth(0.6)
  doc.line(14, y, 196, y)
  return y + 8
}

const formatValue = (value: number | string | null | undefined, decimals = 2) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value ?? 'N/A'
  return Number(value).toFixed(decimals)
}

export function downloadMachineHealthReport(
  machine: Machine,
  snapshot: MachineHealthSnapshot,
  metrics: MachineMetric[],
  alerts: MachineAlert[],
) {
  const doc = new jsPDF()
  const fileName = `LABES-Machine-Health-${machine.machineId}.pdf`

  doc.setFillColor(5, 46, 31)
  doc.rect(0, 0, 220, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('LABES Machine Health Report', 14, 18)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  let y = 38

  doc.text(`Machine: ${machine.name} (${machine.machineId})`, 14, y)
  y += 8
  doc.text(`Zone: ${machine.zone} | Status: ${snapshot.detectedCondition} | Score: ${snapshot.healthScore}%`, 14, y)
  y += 12

  doc.setFontSize(11)
  doc.text('System Overview', 14, y)
  y = addSectionDivider(doc, y + 4)
  doc.text(`Timestamp: ${snapshot.timestamp}`, 14, y)
  y += 8
  doc.text(`Temperature: ${formatValue(snapshot.temperature)}°C`, 14, y)
  y += 8
  doc.text(`Current draw: ${formatValue(snapshot.current)} A`, 14, y)
  y += 8
  doc.text(`RMS vibration: ${formatValue(snapshot.rms)} mm/s`, 14, y)
  y += 8
  doc.text(`Peak vibration: ${formatValue(snapshot.peak)} mm/s`, 14, y)
  y += 12

  doc.text('Key Metrics', 14, y)
  y = addSectionDivider(doc, y + 4)
  metrics.forEach((metric) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.text(`${metric.label}: ${metric.value} ${metric.unit} (Baseline ${metric.baseline})`, 14, y)
    y += 8
  })

  if (alerts.length) {
    y += 6
    doc.text('Alerts', 14, y)
    y = addSectionDivider(doc, y + 4)
    alerts.forEach((alert) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.text(`• ${alert.title} | ${alert.severity.toUpperCase()} | ${alert.timeAgo}`, 14, y)
      y += 8
    })
  }

  y += 8
  doc.text('AI Interpretation', 14, y)
  y = addSectionDivider(doc, y + 4)
  const explanation = snapshot.explanation.length > 650 ? `${snapshot.explanation.slice(0, 650)}...` : snapshot.explanation
  const splitText = doc.splitTextToSize(explanation, 180)
  splitText.forEach((line: string) => {
    if (y > 280) {
      doc.addPage()
      y = 20
    }
    doc.text(line, 14, y)
    y += 7
  })

  doc.save(fileName)
}

export function downloadSafetyReport(events: SafetyEventRow[], latestAlert: SafetyEventRow | null) {
  const doc = new jsPDF()
  const fileName = 'LABES-Worker-Safety-Report.pdf'
  const openCount = events.filter((event) => event.status === 'open').length
  const resolvedCount = events.filter((event) => event.status === 'resolved').length

  doc.setFillColor(11, 68, 59)
  doc.rect(0, 0, 220, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('LABES Worker Safety Report', 14, 18)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  let y = 38

  doc.text(`Total Events: ${events.length} | Open: ${openCount} | Resolved: ${resolvedCount}`, 14, y)
  y += 12
  doc.text(`Latest Alert: ${latestAlert ? `${latestAlert.event} (${latestAlert.zone})` : 'No active alert'}`, 14, y)
  y += 12

  doc.setFontSize(11)
  doc.text('Recent Event Timeline', 14, y)
  y = addSectionDivider(doc, y + 4)

  events.forEach((event) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    const eventLabel = `${event.zone} | ${event.event} | ${event.status.toUpperCase()} | ${new Date(event.timestamp).toLocaleString()}`
    doc.text(`• ${eventLabel}`, 14, y)
    y += 8
  })

  doc.save(fileName)
}

export interface FleetMachineReportItem {
  machineId: string
  name: string
  zone: string
  type?: string
  status: string
  healthScore: number | null
  temperature: number | null
  rms: number | null
  connected: boolean
}

export function downloadFleetReport(machines: FleetMachineReportItem[]) {
  const doc = new jsPDF()
  const fileName = `LABES-Fleet-Health-Report-${new Date().toISOString().slice(0, 10)}.pdf`

  // Header Banner
  doc.setFillColor(5, 46, 31)
  doc.rect(0, 0, 220, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('LABES Fleet Machine Health Report', 14, 18)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  let y = 38

  const healthy = machines.filter((m) => m.status === 'ONLINE' || m.status === 'Healthy').length
  const warning = machines.filter((m) => m.status === 'WARNING' || m.status === 'Warning').length
  const critical = machines.filter((m) => m.status === 'CRITICAL' || m.status === 'Critical').length
  const offline = machines.filter((m) => m.status === 'OFFLINE' || !m.connected).length

  doc.text(`Fleet Summary (${machines.length} Total Machines)`, 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(
    `Healthy: ${healthy} | Warning: ${warning} | Critical: ${critical} | Offline: ${offline} | Generated: ${new Date().toLocaleString()}`,
    14,
    y
  )
  y += 6

  y = addSectionDivider(doc, y + 4)

  // Machine List
  machines.forEach((machine, idx) => {
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(11)
    doc.setTextColor(5, 46, 31)
    doc.text(
      `${idx + 1}. ${machine.name} (${machine.machineId}) - ${machine.zone}`,
      14,
      y
    )
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    const scoreStr = machine.healthScore !== null && machine.healthScore !== undefined ? `${formatValue(machine.healthScore, 0)}%` : 'N/A'
    const tempStr = machine.temperature !== null && machine.temperature !== undefined ? `${formatValue(machine.temperature, 1)}°C` : 'N/A'
    const rmsStr = machine.rms !== null && machine.rms !== undefined ? `${formatValue(machine.rms, 2)} mm/s` : 'N/A'
    const connStr = machine.connected ? 'CONNECTED' : 'OFFLINE'

    doc.text(
      `Status: ${machine.status.toUpperCase()} (${connStr})  |  Health Score: ${scoreStr}  |  Temp: ${tempStr}  |  Vibration RMS: ${rmsStr}`,
      18,
      y
    )
    y += 8
  })

  doc.save(fileName)
}

