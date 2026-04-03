import Setup from '@/components/setup/Setup.tsx';
import { Container } from './styles.ts';

function SetupPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Setup />
      </div>
    </Container>
  );
}

export default SetupPage;
