import Profile from '@/components/profile/Profile.tsx';
import { Container } from './styles.ts';

function ProfilePage() {
  return (
    <Container>
      <div className="col-span-3">
        <Profile />
      </div>
    </Container>
  );
}

export default ProfilePage;
