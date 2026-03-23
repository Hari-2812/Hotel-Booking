import { useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/auth-context';

const SCRIPT_ID = 'google-identity-script';

export default function GoogleLoginButton() {
  const { loginWithGoogle } = useContext(AuthContext);
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) return undefined;

    function renderButton() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            await loginWithGoogle(credential);
          } catch (error) {
            toast.error(error.message || 'Google sign-in failed');
          }
        },
      });

      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 320,
        shape: 'pill',
      });
    }

    if (window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', renderButton);
    }

    return () => {
      script?.removeEventListener?.('load', renderButton);
    };
  }, [clientId, loginWithGoogle]);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
        Google OAuth becomes available after setting <code>VITE_GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_ID</code>.
      </div>
    );
  }

  return <div ref={containerRef} className="flex min-h-11 items-center justify-center" />;
}
