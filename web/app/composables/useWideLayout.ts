export function useWideLayout() {
  const isWide = ref(false)

  onMounted(() => {
    const query = window.matchMedia('(min-width: 64rem)')
    const update = () => {
      isWide.value = query.matches
    }
    update()
    query.addEventListener('change', update)
    onBeforeUnmount(() => query.removeEventListener('change', update))
  })

  return { isWide }
}
