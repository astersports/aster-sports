import { Link } from 'react-router-dom';

// Wave 3.B #27 P0-2 closure (Part 1 of 2): scaffold page.
// THIS DOCUMENT IS A DRAFT placeholder. Replace each `[OPERATOR-FILLS]`
// block with reviewed legal text before any second-tenant onboarding,
// public marketing, or GA launch. Companion: PrivacyPolicyPage.jsx.

export default function TermsOfServicePage() {
  return (
    <div style={page}>
      <div style={card}>
        <DraftBanner />
        <h1 style={h1}>Terms of Service</h1>
        <p style={meta}>Last updated: 2026-06-02 · Draft v0 (placeholder)</p>

        <Section title="1. Agreement">
          <p style={body}>
            By using Aster Sports (operated by Olive Juice Inc.), you agree to these terms.
            <Placeholder note="Acceptance mechanics; updates + re-acceptance; effective date" />
          </p>
        </Section>

        <Section title="2. Who can use the service">
          <p style={body}>
            Accounts are for adults (18+) acting as parents, guardians, coaches, or
            administrators for a youth-sports organization on the platform. Children do
            not have accounts; their information is provided by their parent or guardian.
            <Placeholder note="Eligibility, age requirements, jurisdiction, prohibited uses" />
          </p>
        </Section>

        <Section title="3. Accounts and responsibility">
          <p style={body}>
            You are responsible for the information you provide and the activity on your
            account. Keep your sign-in credentials private.
            <Placeholder note="Account security obligations, multi-user / shared-device guidance, suspension/termination" />
          </p>
        </Section>

        <Section title="4. Payments (when applicable)">
          <p style={body}>
            Registration fees and other charges are billed by your organization through
            the platform. Refunds and payment disputes are handled by the organization.
            <Placeholder note="Payment processor disclosure, refund policy, dispute mechanism, billing-cycle terms" />
          </p>
        </Section>

        <Section title="5. Acceptable use">
          <p style={body}>
            Do not attempt to access data you are not entitled to see. Do not abuse the
            messaging features, impersonate others, or upload content you do not have the
            right to share.
            <Placeholder note="Prohibited content + activity list; reporting mechanism; enforcement; SafeSport reporting cross-link" />
          </p>
        </Section>

        <Section title="6. Content and consent">
          <p style={body}>
            By uploading content (photos, messages, notes) you grant the platform the
            license needed to display and store it for the operating purposes of your
            organization. Photo/video consent for minors is a separate acknowledgment
            collected from the parent or guardian.
            <Placeholder note="License grant scope, retention, removal-on-request; photo consent specifics" />
          </p>
        </Section>

        <Section title="7. Liability + warranty">
          <p style={body}>
            The platform is provided "as is" without warranty. We work to keep it secure
            and available but cannot guarantee uninterrupted service.
            <Placeholder note="Limitation of liability, warranty disclaimer (jurisdiction-specific), indemnification" />
          </p>
        </Section>

        <Section title="8. Termination">
          <p style={body}>
            You can stop using the service at any time. Account deletion requests are
            handled per the Privacy Policy. We may suspend or terminate accounts that
            violate these terms.
            <Placeholder note="Termination mechanics, data retention after termination, survival of clauses" />
          </p>
        </Section>

        <Section title="9. Governing law + disputes">
          <p style={body}>
            <Placeholder note="Choice of law, venue, dispute-resolution mechanism (arbitration vs. courts), class-action waiver if applicable" />
          </p>
        </Section>

        <Section title="10. Contact">
          <p style={body}>
            Questions about these terms: <a href="mailto:olivejuiceinc1@gmail.com" style={link}>olivejuiceinc1@gmail.com</a>.
          </p>
        </Section>

        <p style={footnote}>
          See also: <Link to="/privacy" style={link}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

function DraftBanner() {
  return (
    <div style={banner}>
      <strong>DRAFT — REPLACE BEFORE PUBLIC LAUNCH.</strong> This page is a scaffold.
      Each <code style={code}>[OPERATOR-FILLS]</code> marker needs reviewed legal text.
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={section}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

function Placeholder({ note }) {
  return <span style={ph}> [OPERATOR-FILLS: {note}]</span>;
}

const page = { padding: '32px 16px', background: 'var(--as-bg-page)', minHeight: '100vh' };
const card = { maxWidth: 720, margin: '0 auto', background: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 12, padding: '32px 28px', boxShadow: 'var(--as-shadow-sm)' };
const banner = { background: 'var(--as-warning-soft)', border: '1px solid var(--as-warning)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--as-text-primary)', lineHeight: 1.5, marginBottom: 20 };
const h1 = { fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '0 0 8px', lineHeight: 1.2 };
const h2 = { fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', margin: '24px 0 8px', lineHeight: 1.3 };
const meta = { fontSize: 13, color: 'var(--as-text-tertiary)', margin: '0 0 24px' };
const body = { fontSize: 15, color: 'var(--as-text-secondary)', lineHeight: 1.6, margin: 0 };
const section = { marginBottom: 18 };
const ph = { fontSize: 12, color: 'var(--as-warning)', fontStyle: 'italic' };
const code = { fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12 };
const link = { color: 'var(--as-accent)', textDecoration: 'underline' };
const footnote = { marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--as-border-subtle)', fontSize: 13, color: 'var(--as-text-tertiary)' };
