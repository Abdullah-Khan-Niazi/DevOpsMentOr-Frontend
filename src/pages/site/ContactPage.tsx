import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROUTES } from '@/shared/constants';
import { useScrollReveal } from './hooks';
import { SiteLayout } from './components/SiteLayout';
import { SiteCard } from './components/SiteCard';
import { SiteButton } from './components/SiteButton';
import { NodeGraph } from './components/NodeGraph';
import './ContactPage.css';

// ─── Zod Schemas (§5.6.2 inline validation on blur) ───────────────────────────

const institutionalSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Valid institutional email is required' }),
  institution: z.string().min(2, { message: 'Institution name is required' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

const individualSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Valid email address is required' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

type InstitutionalFormData = z.infer<typeof institutionalSchema>;
type IndividualFormData = z.infer<typeof individualSchema>;

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const isInstitutionalQuery = searchParams.get('inquiry') === 'institution';

  const [submittedPath, setSubmittedPath] = useState<'institutional' | 'individual' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headerRevealRef = useScrollReveal();
  const formsRevealRef = useScrollReveal();

  // React Hook Form setups
  const {
    register: registerInst,
    handleSubmit: handleSubmitInst,
    formState: { errors: errorsInst },
  } = useForm<InstitutionalFormData>({
    resolver: zodResolver(institutionalSchema),
    mode: 'onBlur',
  });

  const {
    register: registerInd,
    handleSubmit: handleSubmitInd,
    formState: { errors: errorsInd },
  } = useForm<IndividualFormData>({
    resolver: zodResolver(individualSchema),
    mode: 'onBlur',
  });

  // Client-side stub submit handler (§5.6.3 cross-fade with 600ms simulated delay)
  const onInstitutionalSubmit = (_data: InstitutionalFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedPath('institutional');
    }, 600);
  };

  const onIndividualSubmit = (_data: IndividualFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedPath('individual');
    }, 600);
  };

  return (
    <SiteLayout>
      <div className="contact-page">
        {/* ── §5.6.1 Header ─────────────────────────────────────────────── */}
        <section
          className="contact-header-section site-section--void"
          aria-labelledby="contact-headline"
        >
          <div className="site-container">
            <div className="site-reveal" ref={headerRevealRef}>
              <h1 id="contact-headline" className="contact-headline">
                Contact
              </h1>
              <p className="contact-subhead">
                For universities and programs,{' '}
                <Link to={ROUTES.FOR_INSTITUTIONS} className="contact-subhead-link">
                  see For Institutions
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ── §5.6.2 Two-Path Split & Success Cross-Fade Container ──────── */}
        <section className="contact-main-section site-section--base" aria-label="Contact options">
          <div className="site-container contact-main-container">
            {/* Background NodeGraph visual (§3.5 / §5.6.2 diverging preset) */}
            <div className="contact-nodegraph-bg" aria-hidden="true">
              <NodeGraph seed="contact-paths" preset="diverging" width={720} height={320} />
            </div>

            <div className="site-reveal contact-forms-wrapper" ref={formsRevealRef}>
              {/* Form Cards State */}
              <div
                className={`contact-forms-grid ${
                  submittedPath !== null ? 'contact-forms-grid--hidden' : ''
                }`}
              >
                {/* ── Card 1: FOR INSTITUTIONS ───────────────────────────────── */}
                <SiteCard highlighted={isInstitutionalQuery} className="contact-card">
                  <div className="contact-card__header">
                    <p className="contact-card__eyebrow">FOR INSTITUTIONS</p>
                    <h2 className="contact-card__title">Institutional Inquiry</h2>
                  </div>

                  <form
                    onSubmit={handleSubmitInst(onInstitutionalSubmit)}
                    className="contact-form"
                    noValidate
                  >
                    {/* Exact field label: Full Name */}
                    <div className="contact-field">
                      <label htmlFor="inst-fullname" className="contact-label">
                        Full Name
                      </label>
                      <input
                        id="inst-fullname"
                        type="text"
                        className={`contact-input ${errorsInst.fullName ? 'contact-input--error' : ''}`}
                        placeholder="Dr. Jane Doe"
                        {...registerInst('fullName')}
                      />
                      {errorsInst.fullName && (
                        <p className="contact-error">{errorsInst.fullName.message}</p>
                      )}
                    </div>

                    {/* Exact field label: Institutional Email */}
                    <div className="contact-field">
                      <label htmlFor="inst-email" className="contact-label">
                        Institutional Email
                      </label>
                      <input
                        id="inst-email"
                        type="email"
                        className={`contact-input ${errorsInst.email ? 'contact-input--error' : ''}`}
                        placeholder="j.doe@university.edu"
                        {...registerInst('email')}
                      />
                      {errorsInst.email && (
                        <p className="contact-error">{errorsInst.email.message}</p>
                      )}
                    </div>

                    {/* Exact field label per §5.6.2 diagram: Institution */}
                    <div className="contact-field">
                      <label htmlFor="inst-name" className="contact-label">
                        Institution
                      </label>
                      <input
                        id="inst-name"
                        type="text"
                        className={`contact-input ${errorsInst.institution ? 'contact-input--error' : ''}`}
                        placeholder="FAST-NUCES CFD"
                        {...registerInst('institution')}
                      />
                      {errorsInst.institution && (
                        <p className="contact-error">{errorsInst.institution.message}</p>
                      )}
                    </div>

                    {/* Exact field label per §5.6.2 diagram: Message */}
                    <div className="contact-field">
                      <label htmlFor="inst-message" className="contact-label">
                        Message
                      </label>
                      <textarea
                        id="inst-message"
                        rows={4}
                        className={`contact-textarea ${errorsInst.message ? 'contact-input--error' : ''}`}
                        placeholder="Details about your cohort size or platform requirements..."
                        {...registerInst('message')}
                      />
                      {errorsInst.message && (
                        <p className="contact-error">{errorsInst.message.message}</p>
                      )}
                    </div>

                    <SiteButton
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="contact-submit-btn"
                    >
                      {isSubmitting ? 'Sending...' : 'Send inquiry'}
                    </SiteButton>
                  </form>
                </SiteCard>

                {/* ── Card 2: FOR INDIVIDUALS ────────────────────────────────── */}
                <SiteCard className="contact-card">
                  <div className="contact-card__header">
                    <p className="contact-card__eyebrow">FOR INDIVIDUALS</p>
                    <h2 className="contact-card__title">General / Support</h2>
                  </div>

                  <form
                    onSubmit={handleSubmitInd(onIndividualSubmit)}
                    className="contact-form"
                    noValidate
                  >
                    {/* Exact field label: Full Name */}
                    <div className="contact-field">
                      <label htmlFor="ind-fullname" className="contact-label">
                        Full Name
                      </label>
                      <input
                        id="ind-fullname"
                        type="text"
                        className={`contact-input ${errorsInd.fullName ? 'contact-input--error' : ''}`}
                        placeholder="Alex Smith"
                        {...registerInd('fullName')}
                      />
                      {errorsInd.fullName && (
                        <p className="contact-error">{errorsInd.fullName.message}</p>
                      )}
                    </div>

                    {/* Exact field label: Email Address */}
                    <div className="contact-field">
                      <label htmlFor="ind-email" className="contact-label">
                        Email Address
                      </label>
                      <input
                        id="ind-email"
                        type="email"
                        className={`contact-input ${errorsInd.email ? 'contact-input--error' : ''}`}
                        placeholder="alex@example.com"
                        {...registerInd('email')}
                      />
                      {errorsInd.email && (
                        <p className="contact-error">{errorsInd.email.message}</p>
                      )}
                    </div>

                    {/* Exact field label per §5.6.2 diagram: Message */}
                    <div className="contact-field">
                      <label htmlFor="ind-message" className="contact-label">
                        Message
                      </label>
                      <textarea
                        id="ind-message"
                        rows={4}
                        className={`contact-textarea ${errorsInd.message ? 'contact-input--error' : ''}`}
                        placeholder="Questions or feedback about student lab access..."
                        {...registerInd('message')}
                      />
                      {errorsInd.message && (
                        <p className="contact-error">{errorsInd.message.message}</p>
                      )}
                    </div>

                    <SiteButton
                      type="submit"
                      variant="secondary"
                      disabled={isSubmitting}
                      className="contact-submit-btn"
                    >
                      {isSubmitting ? 'Sending...' : 'Send message'}
                    </SiteButton>
                  </form>
                </SiteCard>
              </div>

              {/* ── §5.6.3 Success State Cross-Fade Layer ───────────────────── */}
              <div
                className={`contact-success-container ${
                  submittedPath === null ? 'contact-success-container--hidden' : ''
                }`}
                aria-live="polite"
              >
                <SiteCard className="contact-success-card">
                  <div className="contact-success-content">
                    <p className="contact-success-eyebrow">
                      {submittedPath === 'institutional'
                        ? 'INSTITUTIONAL INQUIRY RECEIVED'
                        : 'MESSAGE RECEIVED'}
                    </p>
                    <h2 className="contact-success-title">
                      Received. We&apos;ll respond within 2 business days.
                    </h2>
                    <p className="contact-success-body">
                      Thank you for contacting DevOpsMentOr. Your inquiry has been routed to our
                      team.
                    </p>

                    {/* Optional soft reset link (addition for convenience) */}
                    <button
                      type="button"
                      onClick={() => setSubmittedPath(null)}
                      className="contact-reset-btn"
                    >
                      Send another message
                    </button>
                  </div>
                </SiteCard>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
