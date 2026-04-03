import BudgetDetails from '@/components/budgets/details/BudgetDetails.tsx';
import { Container } from './styles.ts';

function BudgetDetailsPage() {
  return (
    <Container>
      <div className="col-span-3">
        <BudgetDetails />
      </div>
    </Container>
  );
}

export default BudgetDetailsPage;
