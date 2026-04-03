import Stats, { StatTab } from '@/components/stats/Stats.tsx';
import { Container } from './styles.ts';

export { StatTab };

type Props = { defaultTab?: StatTab };

function StatsPage({ defaultTab }: Props) {
  return (
    <Container>
      <div className="col-span-3">
        <Stats defaultTab={defaultTab} />
      </div>
    </Container>
  );
}

export default StatsPage;
