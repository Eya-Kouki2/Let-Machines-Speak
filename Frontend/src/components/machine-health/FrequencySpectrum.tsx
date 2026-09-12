import type { FrequencyBin } from '../../types/machineHealth'

interface FrequencySpectrumProps {
  spectrum: FrequencyBin[]
  dominantFrequency: number
  dominantAmplitude: number
}

export function FrequencySpectrum({ spectrum, dominantFrequency, dominantAmplitude }: FrequencySpectrumProps) {
  const maxAmplitude = Math.max(...spectrum.map((bin) => bin.amplitude), 1)

  return (
    <article className="mh-card mh-chart-card">
      <div className="mh-section-heading">
        <div>
          <h2>Frequency Spectrum</h2>
          <p>0-500 Hz · Dominant component highlighted</p>
        </div>
        <div className="mh-dominant-box">
          <span>Dominant</span>
          <strong>{dominantFrequency} Hz</strong>
        </div>
      </div>
      <div className="mh-spectrum" role="img" aria-label="Frequency spectrum">
        {spectrum.map((bin) => (
          <span
            key={bin.frequency}
            className={Math.abs(bin.frequency - dominantFrequency) < 4 ? 'dominant' : ''}
            title={`${bin.frequency} Hz · ${bin.amplitude.toFixed(2)} g`}
            style={{ height: `${Math.max(4, (bin.amplitude / maxAmplitude) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mh-spectrum-footer">
        <span>Frequency (Hz)</span>
        <strong>Amplitude {dominantAmplitude.toFixed(2)}g</strong>
      </div>
    </article>
  )
}
