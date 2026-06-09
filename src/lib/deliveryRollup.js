// SEE delivery rollup (architect deploy-review E3). Pure aggregation of the
// per-recipient provider-webhook signals into counts for the briefing history
// detail. Uses the *_at signal columns (the canonical webhook truth) — NOT
// bounce_reason, which is NOT a column on comms_message_recipients (the prior
// inline count referenced a phantom column). Complained is included because a
// spam complaint is the highest-signal deliverability metric.
export function deliveryRollup(recipients = []) {
  let delivered = 0, opened = 0, bounced = 0, complained = 0;
  for (const r of recipients) {
    if (r.delivered_at) delivered += 1;
    if (r.opened_at) opened += 1;
    if (r.bounced_at) bounced += 1;
    if (r.complained_at) complained += 1;
  }
  return { total: recipients.length, delivered, opened, bounced, complained };
}
