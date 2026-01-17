import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-xl space-y-6 rounded-2xl border bg-card p-8 shadow-sm"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              RustKey starter
            </p>
            <h1 className="text-3xl font-semibold">
              React, Framer Motion, and shadcn/ui
            </h1>
            <p className="text-sm text-muted-foreground">
              This baseline is ready for layout, motion, and component work. Drop
              in your UI ideas and start shipping.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>Get started</Button>
            <Button variant="outline">View components</Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
