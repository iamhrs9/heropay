import { useEffect } from 'react'

/**
 * Custom hook to lock scrolling on body and mobile-content-viewport
 * whenever a modal/popup is open.
 */
export function useLockScroll(isLocked) {
  useEffect(() => {
    if (!isLocked) return

    document.body.classList.add('modal-open')
    const viewports = document.querySelectorAll('.mobile-content-viewport')
    viewports.forEach((vp) => vp.classList.add('no-scroll'))

    const shell = document.querySelector('.mobile-app-shell')
    if (shell) shell.classList.add('modal-active')

    return () => {
      document.body.classList.remove('modal-open')
      viewports.forEach((vp) => vp.classList.remove('no-scroll'))
      if (shell) shell.classList.remove('modal-active')
    }
  }, [isLocked])
}
