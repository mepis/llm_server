import { ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'

export function useSidebar() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const sidebarOpen = ref(false)

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const openSidebar = () => {
    sidebarOpen.value = true
  }

  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  return {
    isMobile,
    sidebarOpen,
    toggleSidebar,
    openSidebar,
    closeSidebar
  }
}
