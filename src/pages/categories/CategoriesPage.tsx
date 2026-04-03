import Categories from '@/components/categories/Categories.tsx';
import { Container } from './styles.ts';

function CategoriesPage() {
  return (
    <Container>
      <div className="col-span-3">
        <Categories />
      </div>
    </Container>
  );
}

export default CategoriesPage;
