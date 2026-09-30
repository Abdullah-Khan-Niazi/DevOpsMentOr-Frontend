import { useState } from 'react';
import { Button, Card, toast } from '@/shared/components';
import { use2fa } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { OtpInputGroup } from '@/features/auth/components/OtpInputGroup';
import { QRCodeDisplay } from '@/features/auth/components/QRCodeDisplay';
import '@/shared/styles/app.css';
import './SettingsSecurity.css';

const ALREADY_ENABLED = 'Two-factor authentication is already enabled.';

type TwoFactorState = 'loading' | 'disabled' | 'setup' | 'enabled' | 'verifying-disable';

interface TwoFactorSetup {
  secret: string;
  otpAuthUri: string;
}

export default function SecurityPage() {
  const { enable, verify, disable } = use2fa();
  const twoFactorEnabled = useAuthStore((state) => state.user?.twoFactorEnabled);
  const [flowState, setFlowState] = useState<'setup' | 'verifying-disable' | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);

  // Derive the active state from flowState if in a setup/disable workflow,
  // or dynamically from the auth store's twoFactorEnabled flag.
  const state: TwoFactorState =
    flowState ??
    (twoFactorEnabled === undefined ? 'loading' : twoFactorEnabled ? 'enabled' : 'disabled');

  const handleEnable = () => {
    setSetupError(null);
    enable.mutate(undefined, {
      onSuccess: (nextSetup) => {
        setSetup(nextSetup);
        setFlowState('setup');
      },
      onError: (error) => {
        if (error.message === ALREADY_ENABLED) {
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().setUser({ ...user, twoFactorEnabled: true });
          }
          setFlowState(null);
        } else {
          toast.error(error.message);
        }
      },
    });
  };

  const handleVerify = () => {
    if (!setup || code.length < 6) return;
    verify.mutate(
      { code, secret: setup.secret },
      {
        onSuccess: () => {
          toast.success('2FA enabled successfully.');
          setCode('');
          setSetup(null);
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().setUser({ ...user, twoFactorEnabled: true });
          }
          setFlowState(null);
        },
        onError: (error) => setSetupError(error.message),
      },
    );
  };

  const handleDisable = () => {
    if (code.length < 6) return;
    disable.mutate(
      { code },
      {
        onSuccess: () => {
          toast.success('2FA disabled.');
          setCode('');
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().setUser({ ...user, twoFactorEnabled: false });
          }
          setFlowState(null);
        },
        onError: (error) => setSetupError(error.message),
      },
    );
  };

  return (
    <div>
      <header className="app-page-header">
        <h1 className="app-page-header__title">Security</h1>
        <p className="app-page-header__description">
          Two-factor authentication adds a code from your authenticator app to every sign in.
        </p>
      </header>

      <div className="settings-stack">
        {state === 'loading' ? (
          <Card className="settings-card">
            <p className="settings-card__body">Loading security settings...</p>
          </Card>
        ) : null}

        {state === 'disabled' ? (
          <Card className="settings-card">
            <h2 className="settings-card__title">Two-factor authentication</h2>
            <p className="settings-card__body">
              2FA is currently disabled. When enabled, sign in requires a 6-digit code from your
              authenticator app.
            </p>
            <div>
              <Button type="button" onClick={handleEnable} isLoading={enable.isPending}>
                Enable 2FA
              </Button>
            </div>
          </Card>
        ) : null}

        {state === 'setup' ? (
          <Card className="settings-card">
            <h2 className="settings-card__title">Scan to set up</h2>
            <div className="settings-2fa">
              {setup ? <QRCodeDisplay otpAuthUri={setup.otpAuthUri} /> : null}

              {setup ? (
                <div className="settings-2fa__secret">
                  <span className="settings-2fa__label">Manual entry secret</span>
                  <code className="settings-2fa__secret-value">{setup.secret}</code>
                </div>
              ) : null}

              <p className="settings-card__body">
                Scan the QR code with your authenticator app, then enter the 6-digit code to confirm
                setup.
              </p>

              <OtpInputGroup value={code} onChange={setCode} disabled={verify.isPending} />

              {setupError ? (
                <p className="auth-alert auth-alert--error" role="alert">
                  {setupError}
                </p>
              ) : null}

              <div className="settings-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFlowState(null);
                    setCode('');
                    setSetup(null);
                    setSetupError(null);
                  }}
                  disabled={verify.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleVerify}
                  isLoading={verify.isPending}
                  disabled={code.length < 6}
                >
                  Verify and enable
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {state === 'enabled' || state === 'verifying-disable' ? (
          <Card className="settings-card">
            <h2 className="settings-card__title">Two-factor authentication</h2>

            {state === 'enabled' ? (
              <>
                <p className="settings-card__body">
                  2FA is enabled. You will be asked for a 6-digit code at every sign in.
                </p>
                <div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setCode('');
                      setSetupError(null);
                      setFlowState('verifying-disable');
                    }}
                  >
                    Disable 2FA
                  </Button>
                </div>
              </>
            ) : (
              <div className="settings-2fa">
                <p className="settings-card__body">
                  To disable 2FA, enter the current code from your authenticator app.
                </p>
                <OtpInputGroup value={code} onChange={setCode} disabled={disable.isPending} />

                {setupError ? (
                  <p className="auth-alert auth-alert--error" role="alert">
                    {setupError}
                  </p>
                ) : null}

                <div className="settings-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setFlowState(null);
                      setCode('');
                      setSetupError(null);
                    }}
                    disabled={disable.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDisable}
                    isLoading={disable.isPending}
                    disabled={code.length < 6}
                  >
                    Confirm disable
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
