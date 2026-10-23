import Layout from "../../components/common/Layout";
import RoleAssistant from "../../components/common/RoleAssistant";

const LINKS = [
  { to: "/doctor/dashboard", label: "Dashboard" },
  { to: "/doctor/patients", label: "Patients" },
  { to: "/doctor/appointments", label: "Appointments" },
  { to: "/doctor/prescriptions", label: "Prescriptions" },
  { to: "/doctor/safety-alerts", label: "Safety Alerts" },
  { to: "/doctor/ai-assistant", label: "AI Assistant" },
  { to: "/doctor/profile", label: "Profile" },
];

export default function AIAssistant() {
  return (
    <Layout links={LINKS}>
      <RoleAssistant
        links={LINKS}
        role="doctor"
        title="MERIDIAN AI"
        subtitle="Your intelligent clinical support assistant"
        welcome="How can I support your practice today?"
        placeholder="Ask about a patient, medication, lab trend, or treatment plan..."
        prompts={["Summarize clinic activity", "Review recent lab trends", "Find appointment details"]}
      />
    </Layout>
  );
}
