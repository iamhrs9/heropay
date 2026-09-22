import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const AdminPanel = lazy(() => import('./screens/AdminPanel'))

const isAdminRoute = ['/adminonly', '/admin', '/adminpanel'].includes(window.location.pathname.toLowerCase())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminRoute ? (
      <Suspense fallback={
        <div style={{
          minHeight: '100vh',
          background: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94A3B8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255, 126, 43, 0.2)',
            borderTopColor: '#FF7E2B',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading Admin Portal...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <AdminPanel />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
)
