import Transactions from '@/components/transactions/Transactions.tsx';
import { Container } from './styles.ts';

function TransactionsPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Transactions />
      </div>
    </Container>
  );
}

export default TransactionsPage;
