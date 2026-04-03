import Dashboard from '@/components/dashboard/Dashboard.tsx';
import { Container } from './styles.ts';

function DashboardPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Dashboard />
      </div>
    </Container>
  );
}

export default DashboardPage;
