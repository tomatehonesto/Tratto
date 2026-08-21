import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Splash } from './AuthShell'

/**
 * Só libera as rotas internas com sessão válida. Enquanto a sessão inicial
 * está sendo restaurada mostra o splash — sem isso, um refresh piscaria a
 * tela de login antes de reconhecer o usuário já autenticado.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Splash />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
