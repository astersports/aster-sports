import AutoNotificationSettingsForm from './AutoNotificationSettingsForm';
import ChannelMatrixForm from './ChannelMatrixForm';
import AlertSettingsForm from './AlertSettingsForm';
import SenderIdentityForm from './SenderIdentityForm';
import OrganizationForm from './OrganizationForm';
import RegistrationForm from './RegistrationForm';
import FeaturesForm from './FeaturesForm';
import CustomDomainForm from './CustomDomainForm';
import PilotModeForm from './PilotModeForm';

// All /admin/settings FullScreenForm mounts in one place, keyed off `openForm`,
// so AdminSettingsPage stays a thin row-list under the 150-line cap (decomposed
// at the Step-4 cap-pressure trigger). Each form is mounted always (returns null
// when closed) and seeded from the live hooks. Bucket-A sections write via
// os.save; auto-notifications writes via an.save (the RPC).
export default function SettingsSheets({ openForm, setOpenForm, an, os, al, org }) {
  const s = os.settings;
  const close = () => setOpenForm(null);
  return (
    <>
      <OrganizationForm
        open={openForm === 'org'} onClose={close}
        initial={{ name: org?.name, mailingAddress: org?.mailing_address, seasonLabel: s?.season_label, timezone: s?.timezone }}
        onSave={os.save} saving={os.saving}
      />
      <RegistrationForm
        open={openForm === 'registration'} onClose={close}
        initial={{ registrationOpen: s?.registration_open }}
        onSave={os.save} saving={os.saving}
      />
      <FeaturesForm
        open={openForm === 'features'} onClose={close}
        initial={{ futuresEnabled: s?.futures_academy_enabled, carpoolEnabled: s?.carpool_enabled }}
        onSave={os.save} saving={os.saving}
      />
      <CustomDomainForm
        open={openForm === 'domain'} onClose={close}
        initial={{ customDomain: s?.custom_domain }}
        onSave={os.save} saving={os.saving}
      />
      <AutoNotificationSettingsForm
        open={openForm === 'autonotif'} onClose={close}
        initial={{ remindersOn: an.remindersOn, nudgesOn: an.nudgesOn, minGoing: an.minGoing }}
        onSave={an.save} saving={an.saving}
      />
      <ChannelMatrixForm
        open={openForm === 'channels'} onClose={close}
        initial={{ channels: s?.notification_channels }}
        onSave={os.save} saving={os.saving}
      />
      <AlertSettingsForm
        open={openForm === 'alerts'} onClose={close}
        configs={al.configs} onSave={al.save} saving={al.saving}
      />
      <SenderIdentityForm
        open={openForm === 'sender'} onClose={close}
        initial={{ fromName: s?.from_name, fromEmail: s?.from_email, replyTo: s?.reply_to_email }}
        onSave={os.save} saving={os.saving}
      />
      <PilotModeForm
        open={openForm === 'pilot'} onClose={close}
        initial={{ pilotEnabled: s?.pilot_mode_enabled, testRecipientEmail: s?.pilot_test_recipient_email }}
        onSave={os.save} saving={os.saving}
      />
    </>
  );
}
