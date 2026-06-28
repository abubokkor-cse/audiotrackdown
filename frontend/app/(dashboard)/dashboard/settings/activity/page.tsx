import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  ClipboardList,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up';
    case ActivityType.SIGN_IN:
      return 'You signed in';
    case ActivityType.SIGN_OUT:
      return 'You signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account';
    case ActivityType.CREATE_TEAM:
      return 'You created a new team';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation';
    default:
      return 'Unknown action occurred';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      {/* ── Page Header ── */}
      <div className="mb-8 atd-stagger atd-stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Activity Log
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track all sign-ins, account changes, and security events.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-gray-200/80 shadow-sm rounded-2xl overflow-hidden atd-card-hover atd-stagger atd-stagger-2">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">
              Recent Activity
            </CardTitle>
            {logs.length > 0 && (
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {logs.length} event{logs.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {logs.map((log: any, index: number) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                return (
                  <li
                    key={log.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors duration-150"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formattedAction}
                        {log.ipAddress && (
                          <span className="text-gray-400 font-normal">
                            {' '}from {log.ipAddress}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <p className="text-xs text-gray-400">
                          {getRelativeTime(new Date(log.timestamp))}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                When you perform actions like signing in or updating your
                account, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
