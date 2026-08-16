import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function EmailVerification() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const url = new URL(window.location.href);
        
        // Supabase sends verification params in the URL hash or query
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash || url.search);
        
        const accessToken = params.get('access_token');
        const tokenHash = params.get('token_hash');
        const type = params.get('type');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // If there's an access_token, the session is already established
        if (accessToken) {
          setStatus('success');
          setMessage('Email confirmed successfully!');
          return;
        }

        // If there's a token_hash, use verifyOtp
        if (tokenHash && type === 'signup') {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email',
          });

          if (verifyError) {
            throw verifyError;
          }

          if (data?.user?.email_confirmed_at) {
            setStatus('success');
            setMessage('Email confirmed successfully!');
            return;
          }
        }

        // Fallback: check if we can extract and set session from URL
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data?.session?.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Email confirmed successfully!');
          return;
        }

        throw new Error('Could not verify email. Please check the link and try again.');
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to confirm email. Please try again or resend the verification email.');
      }
    };

    verifyEmail();
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #fff5f9 0%, #f3e8ff 100%)',
    }}>
      <div style={{
        width: 'min(100%, 560px)',
        background: '#fff',
        borderRadius: '20px',
        padding: '48px 36px',
        boxShadow: '0 20px 60px rgba(123, 58, 180, 0.12)',
        textAlign: 'center',
        border: '1px solid rgba(168, 85, 247, 0.08)',
      }}>
        {status === 'verifying' && (
          <>
            <div style={{
              width: '88px',
              height: '88px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: '#f0f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 1.5s linear infinite',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid #7c3aed',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', lineHeight: 1.2 }}>
              Confirming Email
            </h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '88px',
              height: '88px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              fontWeight: 700,
              boxShadow: '0 10px 24px rgba(16, 185, 129, 0.3)',
            }}>
              ✓
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 2.6rem)', lineHeight: 1.2 }}>
              Email Confirmed!
            </h1>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '88px',
              height: '88px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              fontWeight: 700,
              boxShadow: '0 10px 24px rgba(239, 68, 68, 0.3)',
            }}>
              ✕
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', lineHeight: 1.2 }}>
              Verification Failed
            </h1>
          </>
        )}

        <p style={{
          margin: '18px auto 0',
          maxWidth: '420px',
          fontSize: '1.05rem',
          color: '#4b5563',
          lineHeight: 1.7,
        }}>
          {message}
        </p>

        {status !== 'verifying' && (
          <div style={{
            marginTop: '28px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#374151',
            fontSize: '0.98rem',
          }}>
            {status === 'success'
              ? 'Return to the app and click continue. Your email has been confirmed and you can proceed to the next step.'
              : 'Please check the email link and try again, or request a new verification email.'}
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </main>
  );
}
