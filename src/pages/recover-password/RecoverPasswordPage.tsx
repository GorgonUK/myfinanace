import RecoverPassword from '@/components/auth/RecoverPassword.tsx';
import { Container } from './styles.ts';

function RecoverPasswordPage() {
  return (
    <Container>
      <div className="col-span-3">
        <RecoverPassword />
      </div>
    </Container>
  );
}

export default RecoverPasswordPage;
