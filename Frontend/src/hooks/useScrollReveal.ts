import { useEffect } from 'react'

/**
 * useScrollReveal — bidirectional, always-on
 * Elements animate in every time they enter the viewport (from any direction)
 * and reset when they leave, ready to animate again.
 */
export function useScrollReveal() {
  useEffect(() => {
    const getTargets = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right')
      )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element entered viewport — animate in
            entry.target.classList.add('reveal-visible')
          } else {
            // Element left viewport — reset so it can animate again
            entry.target.classList.remove('reveal-visible')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    const timer = setTimeout(() => {
      getTargets().forEach((el) => observer.observe(el))
    }, 80)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])
}
