import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

// NOTE: React.StrictMode is intentionally omitted.
// React 19 StrictMode causes @react-three/fiber Canvas to render black.
// See: https://github.com/pmndrs/react-three-fiber/issues/3385
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)

