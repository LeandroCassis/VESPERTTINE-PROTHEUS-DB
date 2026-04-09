import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Relationships } from '@/pages/Relationships';
import { SqlGenerator } from '@/pages/SqlGenerator';
import { TableDetail } from '@/pages/TableDetail';
import { TableExplorer } from '@/pages/TableExplorer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/tabelas" replace />} />
          <Route path="/tabelas" element={<TableExplorer />} />
          <Route path="/tabela/:id" element={<TableDetail />} />
          <Route path="/tabela/:id/sql" element={<SqlGenerator />} />
          <Route path="/relacionamentos" element={<Relationships />} />
          <Route path="*" element={<Navigate to="/tabelas" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
