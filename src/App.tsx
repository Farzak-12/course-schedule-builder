import { useOptimizedPicks } from '@/hooks/useOptimizedPicks'
import { AppShell } from '@/components/layout/AppShell'

function App() {
  useOptimizedPicks()
  return <AppShell />
}

export default App
