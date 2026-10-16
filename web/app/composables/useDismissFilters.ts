import type { Ref } from 'vue'

const scrollKeys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '])

export function useDismissFilters(open: Ref<boolean>, root: Ref<HTMLElement | null>) {
  let anchor = 0
  let fromUser = false
  let userTimer: ReturnType<typeof setTimeout> | undefined

  function onSmallScreen() {
    return window.matchMedia('(max-width: 63.99rem)').matches
  }

  function markUserScroll() {
    fromUser = true
    clearTimeout(userTimer)
    userTimer = setTimeout(() => {
      fromUser = false
    }, 700)
  }

  function onScroll() {
    if (!open.value || !onSmallScreen()) return
    if (!fromUser) {
      anchor = window.scrollY
      return
    }
    if (Math.abs(window.scrollY - anchor) < 8) return
    open.value = false
  }

  function onWheel() {
    if (!open.value || !onSmallScreen()) return
    markUserScroll()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!open.value || !onSmallScreen() || !scrollKeys.has(event.key)) return
    const target = event.target
    if (target instanceof Element && target.closest('input, textarea, select, button, [contenteditable="true"]')) return
    markUserScroll()
  }

  function onPointerDown(event: PointerEvent) {
    if (!open.value || !onSmallScreen()) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (root.value?.contains(target)) return
    if (target instanceof Element && target.closest('[data-reka-popper-content-wrapper]')) return
    open.value = false
  }

  watch(open, (value) => {
    if (!value) return
    anchor = window.scrollY
    fromUser = false
  }, { flush: 'sync' })

  onMounted(() => {
    anchor = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchmove', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    onBeforeUnmount(() => {
      clearTimeout(userTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    })
  })
}
