import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import { AuthContextProvider } from './context/AuthContext.tsx'
import App from './App.tsx'
import "./styles/global.css"
import "./styles/index.css"
import "./styles/App.css"
import { Toaster } from './components/ui/toast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <App />
        <Toaster/>
      </AuthContextProvider>
    </BrowserRouter>
  </StrictMode>,
)
