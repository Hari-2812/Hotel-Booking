import { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/auth-context';
import { canUseFirebase, signInWithFirebaseGoogle } from '../services/firebase';

export default function FirebaseLoginButton() {
  const { loginWithGoogle } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  async function handleFirebaseLogin() {
    setLoading(true);
    try {
      const idToken = await signInWithFirebaseGoogle();
      await loginWithGoogle(idToken);
    } catch (error) {
      toast.error(error.message || 'Firebase sign in failed');
    } finally {
      setLoading(false);
    }
  }

  if (!canUseFirebase()) return null;

  return (
    <button type="button" className="btn-secondary w-full" onClick={handleFirebaseLogin} disabled={loading}>
      {loading ? 'Connecting...' : 'Continue with Firebase'}
    </button>
  );
}
