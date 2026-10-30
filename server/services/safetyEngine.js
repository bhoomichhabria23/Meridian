const SafetyAlert = require("../models/SafetyAlert");
const Allergy = require("../models/Allergy");
const Medication = require("../models/Medication");
const LabResult = require("../models/LabResult");
const Diagnosis = require("../models/Diagnosis");
const Reminder = require("../models/Reminder");
const Patient = require("../models/Patient");

class SafetyEngine {
  static async createPreventiveCareReminders(patientId) {
    const patient = await Patient.findOne({ userId: patientId }).select("age dateOfBirth gender").lean();
    if (!patient) return [];

    let age = Number(patient.age || 0);
    if ((!age || Number.isNaN(age)) && patient.dateOfBirth) {
      age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000);
    }
    if (!age || age < 18) return [];

    const labs = await LabResult.find({ patientId }).sort({ testDate: -1 }).lean();
    const preventiveTests = [
      { title: "Annual preventive wellness lab review", identity: "cbc", intervalDays: 365, priority: "medium" },
      { title: "Preventive lipid profile", identity: "lipid", intervalDays: 365, priority: age >= 40 ? "high" : "medium", minimumAge: 40 },
      { title: "Diabetes screening (HbA1c)", identity: "hba1c", intervalDays: 365, priority: "medium", minimumAge: 45 },
    ];

    const created = [];
    for (const schedule of preventiveTests) {
      if (schedule.minimumAge && age < schedule.minimumAge) continue;
      const matchingLab = labs.find((lab) => {
        const identity = this.normalizeTestIdentity(lab.testCode) || this.normalizeTestIdentity(lab.testName);
        return identity.includes(schedule.identity) || schedule.identity.includes(identity);
      });
      const dueDate = matchingLab
        ? new Date(new Date(matchingLab.testDate).getTime() + schedule.intervalDays * 86400000)
        : new Date(Date.now() - 86400000);
      if (dueDate > new Date()) continue;

      const existing = await Reminder.findOne({
        userId: patientId,
        title: schedule.title,
        status: { $in: ["active", "snoozed"] },
      }).lean();
      if (existing) continue;

      created.push(await Reminder.create({
        userId: patientId,
        title: schedule.title,
        type: "lab_test",
        date: dueDate,
        description: "Preventive care screening is overdue. Review the test and arrange it if clinically appropriate.",
        priority: schedule.priority,
        status: "active",
      }));
    }
    return created;
  }

  static normalizeTestIdentity(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  static findDuplicateTests(labs, candidate = null, windowDays = 30) {
    const records = candidate ? [...labs, candidate] : labs;
    const normalizedRecords = records
      .map((lab) => ({
        lab,
        identity: this.normalizeTestIdentity(lab.testCode) || this.normalizeTestIdentity(lab.testName),
        date: new Date(lab.testDate),
      }))
      .filter((record) => record.identity && !Number.isNaN(record.date.getTime()));

    const groups = new Map();
    normalizedRecords.forEach((record) => {
      const group = groups.get(record.identity) || [];
      group.push(record);
      groups.set(record.identity, group);
    });

    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    const duplicates = [];
    groups.forEach((group) => {
      group.sort((first, second) => first.date - second.date);
      for (let index = 1; index < group.length; index += 1) {
        const previous = group[index - 1];
        if (group[index].date - previous.date <= windowMs) {
          duplicates.push({ previous: previous.lab, duplicate: group[index].lab });
        }
      }
    });
    return duplicates;
  }

  /**
   * Analyze prescription for safety against patient history
   */
  static async analyzePrescription(
    patientId,
    prescription,
    doctorId
  ) {
    const alerts = [];
    let status = "SAFE";

    try {
      // 1. Check for allergy conflicts
      const allergyAlerts = await this.checkAllergyConflicts(
        patientId,
        prescription
      );
      if (allergyAlerts.length > 0) {
        alerts.push(...allergyAlerts);
        if (
          allergyAlerts.some(
            (a) => a.severity === "HIGH"
          )
        ) {
          status = "HIGH_RISK";
        } else {
          status = status === "SAFE"
            ? "WARNING"
            : status;
        }
      }

      // 2. Check for medication interactions
      const interactionAlerts =
        await this.checkMedicationInteractions(
          patientId,
          prescription
        );
      if (interactionAlerts.length > 0) {
        alerts.push(...interactionAlerts);
        if (
          interactionAlerts.some(
            (a) => a.severity === "HIGH"
          )
        ) {
          status = "HIGH_RISK";
        } else {
          status = status === "SAFE"
            ? "WARNING"
            : status;
        }
      }

      // 3. Check for duplicate medications
      const duplicateAlerts =
        await this.checkDuplicateMedication(
          patientId,
          prescription
        );
      if (duplicateAlerts.length > 0) {
        alerts.push(...duplicateAlerts);
        status = status === "SAFE"
          ? "WARNING"
          : status;
      }

      // 4. Check diagnosis considerations
      const diagnosisAlerts =
        await this.checkDiagnosisConsiderations(
          patientId,
          prescription
        );
      if (diagnosisAlerts.length > 0) {
        alerts.push(...diagnosisAlerts);
      }

      // 5. Check lab result considerations
      const labAlerts = await this.checkLabResults(
        patientId,
        prescription
      );
      if (labAlerts.length > 0) {
        alerts.push(...labAlerts);
      }

      return {
        status,
        alerts,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error("Safety analysis error:", error);
      throw error;
    }
  }

  static async analyzePatientHistory(patientId) {
    const [allergies, medications, diagnoses, labs, overdueReminders] = await Promise.all([
      Allergy.find({ patientId, isActive: true }).lean(),
      Medication.find({ patientId, status: { $in: ["active", "ongoing"] } }).lean(),
      Diagnosis.find({ patientId, status: { $in: ["active", "chronic"] } }).lean(),
      LabResult.find({ patientId }).sort({ testDate: -1 }).lean(),
      Reminder.find({ userId: patientId, type: "lab_test", status: "active", date: { $lt: new Date() } }).sort({ date: 1 }).lean(),
    ]);
    const alerts = [];
    const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const overdueTests = overdueReminders.map((reminder) => ({
      type: "overdue_test",
      severity: reminder.priority === "high" ? "HIGH" : "MEDIUM",
      message: reminder.title,
      evidence: `Due ${new Date(reminder.date).toLocaleDateString("en-GB")}${reminder.description ? ` · ${reminder.description}` : ""}`,
      recommendation: "Review whether this investigation is still needed and arrange it if appropriate.",
      relevantRecord: { recordType: "reminder", recordId: reminder._id, recordDetails: reminder.title },
      date: reminder.date,
    }));
    const duplicateTests = SafetyEngine.findDuplicateTests(labs).map(({ previous, duplicate }) => ({
      type: "duplicate_test",
      severity: "MEDIUM",
      message: `Possible duplicate ${duplicate.testName} recorded within 30 days.`,
      evidence: `${previous.testName} was recorded on ${new Date(previous.testDate).toLocaleDateString("en-GB")}; ${duplicate.testName} was recorded on ${new Date(duplicate.testDate).toLocaleDateString("en-GB")}.`,
      recommendation: "Compare the source records before ordering the test again.",
      relevantRecord: { recordType: "lab", recordId: duplicate._id, recordDetails: duplicate.testName },
      date: duplicate.testDate,
    }));
    const labTrends = [];
    const labsByParameter = new Map();
    for (const lab of labs) {
      for (const result of lab.results || []) {
        const value = Number(result.value);
        const parameter = normalize(result.parameter);
        if (!parameter || !Number.isFinite(value)) continue;
        const history = labsByParameter.get(parameter) || [];
        history.push({ value, unit: result.unit || "", date: lab.testDate, label: result.parameter });
        labsByParameter.set(parameter, history);
      }
    }
    for (const history of labsByParameter.values()) {
      history.sort((first, second) => new Date(first.date) - new Date(second.date));
      if (history.length < 2) continue;
      const previous = history[history.length - 2];
      const latest = history[history.length - 1];
      if (latest.value !== previous.value) {
        labTrends.push({
          type: "lab_trend",
          severity: "MEDIUM",
          message: `${latest.label} changed from ${previous.value} to ${latest.value}${latest.unit ? ` ${latest.unit}` : ""}.`,
          evidence: `Compared ${new Date(previous.date).toLocaleDateString("en-GB")} with ${new Date(latest.date).toLocaleDateString("en-GB")}.`,
          recommendation: "Review the direction and clinical significance of this lab trend.",
          relevantRecord: { recordType: "lab", recordId: latest.date, recordDetails: latest.label },
          date: latest.date,
        });
      }
    }
    const allergyMedicationGroups = {
      penicillin: ["amoxicillin", "ampicillin"],
      sulfonamides: ["sulfamethoxazole"],
      nsaids: ["ibuprofen", "naproxen", "indomethacin"],
      aceinhibitors: ["lisinopril", "enalapril"],
    };
    const knownInteractions = [
      ["warfarin", "aspirin", "HIGH"],
      ["warfarin", "ibuprofen", "HIGH"],
      ["warfarin", "naproxen", "HIGH"],
      ["metformin", "alcohol", "MEDIUM"],
      ["lisinopril", "potassium", "HIGH"],
      ["lisinopril", "ibuprofen", "HIGH"],
      ["lisinopril", "naproxen", "HIGH"],
      ["enalapril", "potassium", "HIGH"],
      ["enalapril", "ibuprofen", "HIGH"],
      ["enalapril", "naproxen", "HIGH"],
    ];
    const diagnosisCautions = [
      { medications: ["nsaid", "ibuprofen", "naproxen", "indomethacin", "diclofenac", "celecoxib"], diagnoses: ["renal failure", "hypertension"] },
      { medications: ["ace inhibitor", "lisinopril", "enalapril", "ramipril"], diagnoses: ["hyperkalemia"] },
      { medications: ["metformin"], diagnoses: ["renal failure", "liver disease"] },
    ];

    for (const allergy of allergies) {
      const allergen = normalize(allergy.allergen);
      for (const medication of medications) {
        const medicine = normalize(medication.name);
        const directConflict = allergen && medicine && (medicine.includes(allergen) || allergen.includes(medicine));
        const groupedConflict = Object.entries(allergyMedicationGroups).some(([group, names]) =>
          allergen.includes(normalize(group)) && names.some((name) => medicine.includes(normalize(name)))
        );
        if (directConflict || groupedConflict) {
          const highSeverity = directConflict || ["severe", "life-threatening"].includes(String(allergy.severity || "").toLowerCase());
          alerts.push({
            type: "allergy_conflict",
            severity: highSeverity ? "HIGH" : "MEDIUM",
            message: `Current medication ${medication.name} may conflict with the recorded ${allergy.allergen} allergy.`,
            evidence: `${medication.name} is active; allergy record notes ${allergy.allergen}${allergy.reaction ? ` (${allergy.reaction})` : ""}.`,
            recommendation: "Review the allergy and medication with the patient before continuing treatment.",
            relevantRecord: { recordType: "allergy", recordId: allergy._id, recordDetails: allergy.allergen },
          });
        }
      }
    }

    const medicationsByName = new Map();
    for (const medication of medications) {
      const key = normalize(medication.name);
      if (!key) continue;
      const duplicate = medicationsByName.get(key);
      if (duplicate) {
        alerts.push({
          type: "duplicate_medication",
          severity: "MEDIUM",
          message: `More than one active record exists for ${medication.name}.`,
          evidence: `Active medication records include ${duplicate.name} and ${medication.name}.`,
          recommendation: "Confirm whether both active medication records are intended.",
          relevantRecord: { recordType: "medication", recordId: medication._id, recordDetails: medication.name },
        });
      } else {
        medicationsByName.set(key, medication);
      }
    }

    for (let first = 0; first < medications.length; first += 1) {
      for (let second = first + 1; second < medications.length; second += 1) {
        const firstName = normalize(medications[first].name);
        const secondName = normalize(medications[second].name);
        const interaction = knownInteractions.find(([left, right]) =>
          (firstName.includes(normalize(left)) && secondName.includes(normalize(right))) ||
          (firstName.includes(normalize(right)) && secondName.includes(normalize(left)))
        );
        if (interaction) {
          alerts.push({
            type: "medication_interaction",
            severity: interaction[2],
            message: `Potential interaction between ${medications[first].name} and ${medications[second].name}.`,
            evidence: "Both medications are recorded as active.",
            recommendation: "Review the combination using an authoritative interaction reference.",
            relevantRecord: { recordType: "medication", recordId: medications[second]._id, recordDetails: medications[second].name },
          });
        }
      }
    }

    for (const medication of medications) {
      const medicine = normalize(medication.name);
      for (const diagnosis of diagnoses) {
        const condition = normalize(diagnosis.condition);
        const caution = diagnosisCautions.some((rule) =>
          rule.medications.some((name) => medicine.includes(normalize(name))) &&
          rule.diagnoses.some((name) => condition.includes(normalize(name)))
        );
        if (caution) {
          alerts.push({
            type: "diagnosis_consideration",
            severity: "MEDIUM",
            message: `${medication.name} may need review alongside the recorded ${diagnosis.condition} diagnosis.`,
            evidence: `${medication.name} is active; ${diagnosis.condition} is recorded as ${diagnosis.status}.`,
            recommendation: "Review medication suitability in the context of this diagnosis.",
            relevantRecord: { recordType: "diagnosis", recordId: diagnosis._id, recordDetails: diagnosis.condition },
          });
        }
      }
    }

    for (const lab of labs) {
      for (const result of lab.results || []) {
        const status = String(result.status || "").toLowerCase();
        if (!["abnormal", "critical"].includes(status)) continue;
        alerts.push({
          type: "lab_consideration",
          severity: status === "critical" ? "HIGH" : "MEDIUM",
          message: `${status === "critical" ? "Critical" : "Abnormal"} lab result: ${result.parameter || lab.testName}.`,
          evidence: [result.parameter || lab.testName, result.value, result.unit, result.referenceRange].filter(Boolean).join(" · "),
          recommendation: "Review this result and its relevance to the patient's current treatment.",
          relevantRecord: { recordType: "lab", recordId: lab._id, recordDetails: `${lab.testName} - ${result.parameter || "result"}` },
        });
      }
    }

    const labDrugRules = [
      { labs: ["potassium", "k"], medications: ["lisinopril", "enalapril", "spironolactone"], message: "An abnormal potassium result may increase risk with this medication." },
      { labs: ["creatinine", "egfr", "renal"], medications: ["metformin", "ibuprofen", "naproxen"], message: "An abnormal renal result may require review before continuing this medication." },
      { labs: ["alt", "ast", "liver"], medications: ["paracetamol", "acetaminophen", "statin"], message: "An abnormal liver result may require review before continuing this medication." },
    ];
    for (const lab of labs) {
      for (const result of lab.results || []) {
        if (!["abnormal", "critical"].includes(String(result.status || "").toLowerCase())) continue;
        const parameter = normalize(result.parameter || lab.testName);
        for (const medication of medications) {
          const medicine = normalize(medication.name);
          const rule = labDrugRules.find((candidate) => candidate.labs.some((name) => parameter.includes(normalize(name))) && candidate.medications.some((name) => medicine.includes(normalize(name))));
          if (rule) alerts.push({ type: "lab_drug_contraindication", severity: "HIGH", message: `${rule.message} (${medication.name})`, evidence: `${result.parameter || lab.testName}: ${result.value || result.status}.`, recommendation: "Review the result and medication together before prescribing.", relevantRecord: { recordType: "lab", recordId: lab._id, recordDetails: medication.name } });
        }
      }
    }

    return {
      status: alerts.some((alert) => alert.severity === "HIGH") ? "HIGH_RISK" : alerts.length ? "WARNING" : "SAFE",
      alerts,
      overdueTests,
      duplicateTests,
      labTrends,
      analyzedAt: new Date(),
    };
  }

  /**
   * Check for medication-allergy conflicts
   */
  static async checkAllergyConflicts(
    patientId,
    prescription
  ) {
    const alerts = [];
    const medicationName =
      prescription.medications[0]?.name || "";

    const allergyList = await Allergy.find({
      patientId,
      isActive: true,
    });

    // Simple keyword matching - in production, use a medication database
    const commonConflicts = {
      penicillin: ["amoxicillin", "ampicillin"],
      sulfonamides: ["sulfamethoxazole"],
      nsaids: [
        "ibuprofen",
        "naproxen",
        "indomethacin",
      ],
      ace_inhibitors: [
        "lisinopril",
        "enalapril",
      ],
    };

    for (const allergy of allergyList) {
      const allergen = allergy.allergen
        .toLowerCase();
      const med = medicationName.toLowerCase();

      // Direct match
      if (med.includes(allergen) ||
        allergen.includes(med)) {
        alerts.push({
          type: "allergy_conflict",
          severity: "HIGH",
          message:
            "Potential allergy-related concern detected.",
          evidence: `Patient has recorded allergy to ${allergy.allergen} with ${allergy.severity} severity.`,
          recommendation:
            "Review the patient's allergy history before proceeding.",
          relevantRecord: {
            recordType: "allergy",
            recordId: allergy._id,
            recordDetails: `${allergy.allergen} - ${allergy.reaction}`,
          },
        });
      }

      // Check against known conflict groups
      for (const [group, medications] of Object.entries(
        commonConflicts
      )) {
        if (
          allergen.includes(group) &&
          medications.some((m) =>
            med.includes(m.toLowerCase())
          )
        ) {
          alerts.push({
            type: "allergy_conflict",
            severity: "MEDIUM",
            message: `Potential ${group} allergy concern.`,
            evidence: `Patient has ${allergy.severity} allergy to ${allergy.allergen}.`,
            recommendation:
              "Consider alternative medication if available.",
            relevantRecord: {
              recordType: "allergy",
              recordId: allergy._id,
              recordDetails: `${allergy.allergen} - ${allergy.reaction}`,
            },
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Check for medication interactions with current medications
   */
  static async checkMedicationInteractions(
    patientId,
    prescription
  ) {
    const alerts = [];
    const newMed =
      prescription.medications[0]?.name || "";

    const currentMeds = await Medication.find({
      patientId,
      status: { $in: ["active", "ongoing"] },
    });

    // Known interactions database (simplified)
    const knownInteractions = {
      warfarin: {
        aspirin: "HIGH",
        ibuprofen: "HIGH",
        naproxen: "HIGH",
      },
      metformin: {
        alcohol: "MEDIUM",
      },
      lisinopril: {
        potassium: "HIGH",
        nsaids: "HIGH",
      },
    };

    for (const med of currentMeds) {
      const currentName = med.name.toLowerCase();
      const newName = newMed.toLowerCase();

      const interactions =
        knownInteractions[currentName];
      if (interactions) {
        for (const [
          interactant,
          severity,
        ] of Object.entries(interactions)) {
          if (newName.includes(interactant)) {
            alerts.push({
              type: "medication_interaction",
              severity,
              message: `Potential drug interaction detected between ${med.name} and ${newMed}.`,
              evidence: `Patient is currently on ${med.name}. This medication may interact with the new prescription.`,
              recommendation:
                "Review interaction profile and consider dose adjustment or alternative medication.",
              relevantRecord: {
                recordType: "medication",
                recordId: med._id,
                recordDetails: `${med.name} - ${med.dosage} ${med.frequency}`,
              },
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Check for duplicate medications
   */
  static async checkDuplicateMedication(
    patientId,
    prescription
  ) {
    const alerts = [];
    const newMed =
      prescription.medications[0]?.name || "";

    const currentMeds = await Medication.find({
      patientId,
      status: "active",
    });

    for (const med of currentMeds) {
      if (
        med.name.toLowerCase() ===
        newMed.toLowerCase()
      ) {
        alerts.push({
          type: "duplicate_medication",
          severity: "MEDIUM",
          message:
            "Potential duplicate medication detected.",
          evidence: `Patient is already taking ${med.name} at ${med.dosage}.`,
          recommendation:
            "Verify prescription intent. Consider discontinuing previous medication if appropriate.",
          relevantRecord: {
            recordType: "medication",
            recordId: med._id,
            recordDetails: `${med.name} - ${med.dosage}`,
          },
        });
      }
    }

    return alerts;
  }

  /**
   * Check diagnosis considerations
   */
  static async checkDiagnosisConsiderations(
    patientId,
    prescription
  ) {
    const alerts = [];

    const diagnoses = await Diagnosis.find({
      patientId,
      status: { $in: ["active", "chronic"] },
    });

    // Simplified diagnosis checks
    const contraindications = {
      nsaids: ["renal_failure", "hypertension"],
      ace_inhibitors: ["hyperkalemia"],
      metformin: ["renal_failure", "liver_disease"],
    };

    const newMed =
      prescription.medications[0]?.name || "";

    for (const diagnosis of diagnoses) {
      for (const [
        med,
        contraindDiagnoses,
      ] of Object.entries(contraindications)) {
        if (newMed.toLowerCase().includes(med)) {
          if (
            contraindDiagnoses.some((d) =>
              diagnosis.condition
                .toLowerCase()
                .includes(d)
            )
          ) {
            alerts.push({
              type: "diagnosis_consideration",
              severity: "MEDIUM",
              message: `Medication may require consideration given patient's ${diagnosis.condition} diagnosis.`,
              evidence: `Patient has ${diagnosis.condition} diagnosed on ${diagnosis.diagnosedDate.toDateString()}.`,
              recommendation:
                "Review appropriateness of this medication for the patient's condition.",
              relevantRecord: {
                recordType: "diagnosis",
                recordId: diagnosis._id,
                recordDetails: diagnosis.condition,
              },
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Check lab result considerations
   */
  static async checkLabResults(
    patientId,
    prescription
  ) {
    const alerts = [];

    const labs = await LabResult.find({
      patientId,
    }).sort({ testDate: -1 }).limit(10);

    // Simplified lab checks
    for (const lab of labs) {
      for (const result of lab.results || []) {
        if (
          result.status === "abnormal" ||
          result.status === "critical"
        ) {
          alerts.push({
            type: "lab_consideration",
            severity: result.status === "critical"
              ? "HIGH"
              : "MEDIUM",
            message: `Abnormal lab value found: ${result.parameter} - review before prescribing.`,
            evidence: `${result.parameter}: ${result.value} ${result.unit} (${result.referenceRange}).`,
            recommendation:
              "Review lab results and consider impact on medication choice.",
            relevantRecord: {
              recordType: "lab",
              recordId: lab._id,
              recordDetails: `${lab.testName} - ${result.parameter}`,
            },
          });
        }
      }
    }

    return alerts;
  }
}

module.exports = SafetyEngine;
