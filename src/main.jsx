import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import BiasAuditDashboard from './bias-dashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BiasAuditDashboard />
  </StrictMode>,
)