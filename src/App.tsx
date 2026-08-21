import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Negocios from '@/pages/Negocios'
import Documentos from '@/pages/Documentos'
import Certidoes from '@/pages/Certidoes'
import Auditoria from '@/pages/Auditoria'
import Contratos from '@/pages/Contratos'
import Assinaturas from '@/pages/Assinaturas'
import Administracao from '@/pages/Administracao'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/negocios" element={<Negocios />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/certidoes" element={<Certidoes />} />
        <Route path="/auditoria" element={<Auditoria />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/assinaturas" element={<Assinaturas />} />
        <Route path="/administracao" element={<Administracao />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
