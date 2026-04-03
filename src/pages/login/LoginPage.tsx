import Login from '@/components/auth/Login.tsx';
import { Container } from './styles.ts';

function LoginPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Login />
      </div>
    </Container>
  );
}

export default LoginPage;
