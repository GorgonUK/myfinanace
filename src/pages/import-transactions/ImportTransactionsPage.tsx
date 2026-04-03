import ImportTransactions from '@/components/transactions/import/ImportTransactions.tsx';
import { Container } from './styles.ts';

function ImportTransactionsPage() {
  return (
    <Container>
      <div className="col-span-3">
        <ImportTransactions />
      </div>
    </Container>
  );
}

export default ImportTransactionsPage;
