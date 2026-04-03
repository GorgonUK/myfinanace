import Accounts from '@/components/accounts/Accounts.tsx';
import { Container } from './styles.ts';

function AccountsPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Accounts />
      </div>
    </Container>
  );
}

export default AccountsPage;
