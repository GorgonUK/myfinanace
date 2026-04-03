import Tags from '@/components/tags/Tags.tsx';
import { Container } from './styles.ts';

function TagsPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Tags />
      </div>
    </Container>
  );
}

export default TagsPage;
