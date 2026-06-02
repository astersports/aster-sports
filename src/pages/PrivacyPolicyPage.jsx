import { Link } from 'react-router-dom';

// Wave 3.B #27 P0-2 closure (Part 1 of 2): scaffold page.
// THIS DOCUMENT IS A DRAFT placeholder. Replace each `[OPERATOR-FILLS]`
// block with reviewed legal text before any second-tenant onboarding,
// public marketing, or GA launch. The scaffold guarantees the URL,
// route, and link surface exist; the text is the operator's call.
//
// Companion: src/pages/TermsOfServicePage.jsx, src/lib/consentVersions.js,
// supabase/migrations/20260602181903_guardian_consents_table.sql.
// When the operator replaces the text, also bump the version in
// src/lib/consentVersions.js so existing guardians re-affirm on next
// login (signup-gate wiring is the P0-2 part 2 follow-up).

export default function PrivacyPolicyPage() {
  return (
    <div style={page}>
      <div style={card}>
        <DraftBanner />
        <h1 style={h1}>Privacy Policy</h1>
        <p style={meta}>Last updated: 2026-06-02 · Draft v0 (placeholder)</p>

        <Section title="1. Who we are">
          <p style={body}>
            Aster Sports is a platform operated by Olive Juice Inc. for youth-sports
            organizations. The first organization on the platform is Legacy Hoopers LLC.
            <Placeholder note="Legal-entity address, contact details, jurisdiction" />
          </p>
        </Section>

        <Section title="2. What we collect">
          <p style={body}>
            We collect information you give us when you sign up, register a child for a
            program, RSVP to events, or message coaches/admins through the app. We also
            collect basic device/usage data to operate the service.
            <Placeholder note="Itemize: name, email, phone, child name/DOB, jersey size, payment data, message content, IP, browser/device identifiers, push tokens" />
          </p>
        </Section>

        <Section title="3. How we use it">
          <p style={body}>
            We use the information to operate the platform — scheduling, communications,
            registration, payments, and roster management — and to keep the service
            secure.
            <Placeholder note="Detail each use: service delivery, payment processing, communications, security, analytics, support" />
          </p>
        </Section>

        <Section title="4. Who we share it with">
          <p style={body}>
            We share data with infrastructure providers (Supabase for storage, Vercel
            for hosting, Resend for email, optionally Stripe for payments) under
            data-processing agreements. We do not sell data.
            <Placeholder note="Subprocessor list with links to each provider's DPA; categories shared; transfer mechanisms" />
          </p>
        </Section>

        <Section title="5. Children's privacy (COPPA)">
          <p style={body}>
            Accounts are for adults (parents, guardians, coaches, administrators).
            Children do not sign in to the platform. Child information (name, DOB,
            jersey number, RSVPs) is provided BY a parent or guardian as part of
            registration and roster management.
            <Placeholder note="COPPA posture statement: no direct child accounts; parent-managed child profiles; deletion-on-request mechanism" />
          </p>
        </Section>

        <Section title="6. Your choices">
          <p style={body}>
            You can update your profile information at any time from the Account page.
            You can unsubscribe from email briefings using the link in any briefing
            email. To delete your account or your child's data, contact us via the link
            below.
            <Placeholder note="Specific rights: access, correction, deletion, portability, objection, restriction; how to exercise" />
          </p>
        </Section>

        <Section title="7. Contact">
          <p style={body}>
            Reach the platform operator at <a href="mailto:olivejuiceinc1@gmail.com" style={link}>olivejuiceinc1@gmail.com</a>.
            <Placeholder note="Mail address; data-protection officer contact if applicable" />
          </p>
        </Section>

        <Section title="8. Changes to this policy">
          <p style={body}>
            We may update this policy. Material changes will be announced at next sign-in
            and require re-acknowledgment.
            <Placeholder note="Notification mechanics and change-history pointer" />
          </p>
        </Section>

        <p style={footnote}>
          See also: <Link to="/terms" style={link}>Terms of Service</Link>
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
