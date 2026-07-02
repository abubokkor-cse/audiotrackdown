import { Metadata } from 'next';
import { getUser } from '@/lib/db/queries';
import PricingClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing — AudioTrackDown Pro | Unlimited YouTube Audio & Subtitle Downloads',
  description: 'Compare AudioTrackDown plans. Free tier with 3 daily downloads or Pro from $2.42/mo for unlimited ad-free YouTube audio extraction, dubbed voice downloads, and subtitle exports in 157+ languages.',
};

export default async function PricingPage() {
  const user = await getUser();

  return (
    <main className="bg-white min-h-[calc(100vh-64px)]">
      <PricingClient user={user} />
    </main>
  );
}
