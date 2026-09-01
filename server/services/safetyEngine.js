const SafetyAlert = require("../models/SafetyAlert");
const Allergy = require("../models/Allergy");
const Medication = require("../models/Medication");
const LabResult = require("../models/LabResult");
const Diagnosis = require("../models/Diagnosis");

class SafetyEngine {
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
