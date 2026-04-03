import Goals from '@/components/goals/Goals.tsx';
import { Container } from './styles.ts';

function GoalsPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Goals />
      </div>
    </Container>
  );
}

export default GoalsPage;
