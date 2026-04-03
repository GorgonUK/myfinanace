import Rules from '@/components/rules/Rules.tsx';
import { Container } from './styles.ts';

function RulesPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Rules />
      </div>
    </Container>
  );
}

export default RulesPage;
