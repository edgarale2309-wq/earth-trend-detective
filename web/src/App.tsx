import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './features/home/HomePage'
import { AboutPage, InfoPage } from './features/method/InfoPages'
import AppShell from './shared/AppShell'

const ExplorerPage = lazy(() => import('./features/explorer/ExplorerPage'))
const DetectivePage = lazy(() => import('./features/detective/DetectivePage'))
const PlacePage = lazy(() => import('./features/place/PlacePage'))

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-deep-purple focus:p-3">Skip to content</a>
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorerPage />} />
            <Route path="/detective" element={<DetectivePage />} />
            <Route path="/place" element={<PlacePage />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/method" element={<Navigate to="/info" replace />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
