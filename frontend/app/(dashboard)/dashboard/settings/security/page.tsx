'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Lock,
  Trash2,
  Loader2,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useActionState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

/* ─── Password strength evaluator ─── */
function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '', barColor: '', width: '0%' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: Record<number, { label: string; color: string; barColor: string; width: string }> = {
    0: { label: 'Too short', color: 'text-gray-400', barColor: 'bg-gray-200', width: '0%' },
    1: { label: 'Weak', color: 'text-red-500', barColor: 'bg-red-400', width: '20%' },
    2: { label: 'Fair', color: 'text-amber-500', barColor: 'bg-amber-400', width: '40%' },
    3: { label: 'Good', color: 'text-yellow-500', barColor: 'bg-yellow-400', width: '60%' },
    4: { label: 'Strong', color: 'text-emerald-500', barColor: 'bg-emerald-400', width: '80%' },
    5: { label: 'Excellent', color: 'text-emerald-600', barColor: 'bg-emerald-500', width: '100%' },
  };

  return { score, ...levels[score] };
}

/* ─── Show/Hide Password Input ─── */
function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  defaultValue,
  minLength = 8,
  maxLength = 100,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  onChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          defaultValue={defaultValue}
          onChange={(e) => onChange?.(e.target.value)}
          className="pr-11 h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
        </button>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      {/* ── Page Header ── */}
      <div className="mb-8 atd-stagger atd-stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Security Settings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your password and account security preferences.
            </p>
          </div>
        </div>
      </div>

      {/* ── Change Password Card ── */}
      <Card className="mb-6 border-gray-200/80 shadow-sm rounded-2xl overflow-hidden atd-card-hover atd-stagger atd-stagger-2">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Change Password
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Use a strong password with at least 8 characters, including uppercase, numbers, and symbols.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-5" action={passwordAction}>
            <PasswordInput
              id="current-password"
              name="currentPassword"
              label="Current Password"
              autoComplete="current-password"
              defaultValue={passwordState.currentPassword}
            />

            <div className="space-y-3">
              <PasswordInput
                id="new-password"
                name="newPassword"
                label="New Password"
                autoComplete="new-password"
                defaultValue={passwordState.newPassword}
                onChange={setNewPassword}
              />

              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${strength.barColor}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${strength.color}`}>
                      {strength.label}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className={newPassword.length >= 8 ? 'text-emerald-500' : ''}>
                        8+ chars
                      </span>
                      <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-500' : ''}>
                        Uppercase
                      </span>
                      <span className={/[0-9]/.test(newPassword) ? 'text-emerald-500' : ''}>
                        Number
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-500' : ''}>
                        Symbol
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <PasswordInput
                id="confirm-password"
                name="confirmPassword"
                label="Confirm New Password"
                defaultValue={passwordState.confirmPassword}
                onChange={setConfirmPassword}
              />
              {passwordsMatch && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
              {passwordsMismatch && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                  <AlertTriangle className="w-3.5 h-3.5" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Status messages */}
            {passwordState.error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{passwordState.error}</span>
              </div>
            )}
            {passwordState.success && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{passwordState.success}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all duration-200 atd-btn-lift"
                disabled={isPasswordPending}
              >
                {isPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Danger Zone: Delete Account ── */}
      <div className="atd-stagger atd-stagger-3">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Danger Zone
          </span>
          <div className="flex-1 h-px bg-red-100" />
        </div>

        <Card className="border-red-200/60 shadow-sm rounded-2xl overflow-hidden hover:border-red-200 transition-colors duration-200">
          <CardHeader className="bg-red-50/40 border-b border-red-100/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Delete Account
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently remove your account and all associated data. This action is irreversible.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-semibold">Before you proceed:</strong> Deleting your account will
                permanently erase your download history, Pro subscription (if active), and all account
                settings. This cannot be undone.
              </div>
            </div>

            <form action={deleteAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password" className="text-sm font-medium text-gray-700">
                  Confirm your password to delete
                </Label>
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  placeholder="Enter your current password"
                  defaultValue={deleteState.password}
                  className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-500/10"
                />
              </div>

              {deleteState.error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{deleteState.error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isDeletePending}
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Permanently Delete Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
