import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AdminPanel from './screens/AdminPanel'
import './index.css'

const isAdminRoute = ['/adminonly', '/admin', '/adminpanel'].includes(window.location.pathname.toLowerCase())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminPanel /> : <App />}
  </React.StrictMode>
)
