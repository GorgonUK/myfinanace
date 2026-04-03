import Entities from '@/components/entities/Entities.tsx';
import { Container } from './styles.ts';

function EntitiesPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Entities />
      </div>
    </Container>
  );
}

export default EntitiesPage;
