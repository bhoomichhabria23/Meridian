import Layout from "../../components/common/Layout";
import RoleAssistant from "../../components/common/RoleAssistant";

const LINKS = [
  { to: "/reception/dashboard", label: "Dashboard" },
  { to: "/reception/appointments", label: "Appointments" },
  { to: "/reception/patients", label: "Patients" },
  { to: "/reception/doctors", label: "Doctors" },
  { to: "/reception/schedule", label: "Schedule" },
  { to: "/reception/assistant", label: "AI Assistant" },
  { to: "/reception/profile", label: "Profile" },
];

export default function Assistant() {
  return (
    <Layout links={LINKS}>
      <RoleAssistant
        links={LINKS}
        role="receptionist"
        title="MERIDIAN AI"
        subtitle="Your clinic operations assistant"
        welcome="How can I help with clinic operations today?"
        placeholder="Ask about appointments, patients, doctors, or clinic workflow..."
        prompts={["Check today's appointments", "Find a patient record", "Show doctor availability"]}
      />
    </Layout>
  );
}
