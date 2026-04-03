import BudgetList from '@/components/budgets/list/BudgetList.tsx';
import { Container } from './styles.ts';

function BudgetListPage() {
  return (
    <Container>
      <div className="col-span-3">
        <BudgetList />
      </div>
    </Container>
  );
}

export default BudgetListPage;
