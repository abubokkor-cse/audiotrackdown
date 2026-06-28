'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  UserCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = ''
}: AccountFormProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
          className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
          className="h-11 rounded-xl border-gray-200 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function SettingsPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      {/* ── Page Header ── */}
      <div className="mb-8 atd-stagger atd-stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              General Settings
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your profile information and account details.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-gray-200/80 shadow-sm rounded-2xl overflow-hidden atd-card-hover atd-stagger atd-stagger-2">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Account Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-5" action={formAction}>
            <Suspense fallback={<AccountForm state={state} />}>
              <AccountFormWithData state={state} />
            </Suspense>

            {/* Status messages */}
            {state.error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
            )}
            {state.success && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{state.success}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all duration-200 atd-btn-lift"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
