export type HotDeal = {
  id: string;
  stayId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  published: boolean;
};

// Filled by the VagaGo publishing service when connected. Never infer a sale
// from a regular nightly rate or create synthetic discounts/countdowns.
export const hotDeals: HotDeal[] = [];

export function getPublishedHotDeals(now = new Date()) {
  const timestamp = now.getTime();
  return hotDeals.filter((deal) => deal.published
    && Date.parse(deal.startsAt) <= timestamp
    && Date.parse(deal.endsAt) > timestamp);
}

