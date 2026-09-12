import type { FrequencyBin } from '../../types/machineHealth'

interface FrequencySpectrumProps {
  spectrum: FrequencyBin[]
  dominantFrequency: number
  dominantAmplitude: number
}

export function FrequencySpectrum({ spectrum, dominantFrequency, dominantAmplitude }: FrequencySpectrumProps) {
  const safeSpectrum = Array.isArray(spectrum) ? spectrum.filter((bin) => bin && typeof bin.amplitude === 'number' && Number.isFinite(bin.amplitude)) : []
  const maxAmplitude = safeSpectrum.length > 0 ? Math.max(...safeSpectrum.map((bin) => bin.amplitude), 1) : 1
  const safeDominantAmplitude = typeof dominantAmplitude === 'number' && Number.isFinite(dominantAmplitude) ? dominantAmplitude : 0

  return (
    <article className="mh-card mh-chart-card">
      <div className="mh-section-heading">
        <div>
          <h2>Frequency Spectrum</h2>
          <p>0-500 Hz · Dominant component highlighted</p>
        </div>
        <div className="mh-dominant-box">
          <span>Dominant</span>
          <strong>{Number.isFinite(dominantFrequency) ? dominantFrequency : 0} Hz</strong>
        </div>
      </div>
      <div className="mh-spectrum" role="img" aria-label="Frequency spectrum">
        {safeSpectrum.length === 0 ? <span style={{ color: '#64748b' }}>No FFT data available yet.</span> : safeSpectrum.map((bin) => (
          <span
            key={bin.frequency}
            className={Math.abs(bin.frequency - dominantFrequency) < 4 ? 'dominant' : ''}
            title={`${bin.frequency} Hz · ${Number.isFinite(bin.amplitude) ? bin.amplitude.toFixed(2) : 'N/A'} g`}
            style={{ height: `${Math.max(4, (bin.amplitude / maxAmplitude) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mh-spectrum-footer">
        <span>Frequency (Hz)</span>
        <strong>Amplitude {safeDominantAmplitude.toFixed(2)}g</strong>
      </div>
    </article>
  )
}
