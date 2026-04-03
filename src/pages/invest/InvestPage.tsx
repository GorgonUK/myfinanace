import Invest, { InvestTab } from '@/components/invest/Invest.tsx';
import { Container } from './styles.ts';

export { InvestTab };

type Props = { defaultTab?: InvestTab };

function InvestPage({ defaultTab }: Props) {
  return (
    <Container>
      <div className="col-span-3">
        <Invest defaultTab={defaultTab} />
      </div>
    </Container>
  );
}

export default InvestPage;
