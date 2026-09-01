import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";

const PatientProfile = () => {
  const { patientId } = useParams();
  const [loading, setLoading] =
    useState(true);
  const [patient, setPatient] =
    useState(null);
  const [timeline, setTimeline] =
    useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tab, setTab] = useState(
    "timeline"
  );

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token");

      // Fetch patient profile
      const patientResponse =
        await axios.get(
          `/api/doctors/patients/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setPatient(
        patientResponse.data.data
      );

      // Fetch timeline
      const timelineResponse =
        await axios.get(
          `/api/doctors/patients/${patientId}/timeline`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setTimeline(
        timelineResponse.data.data
          .events
      );

      // Fetch safety alerts
      const alertsResponse =
        await axios.get(
          `/api/safety/patient/${patientId}/alerts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setAlerts(
        alertsResponse.data.data || []
      );
    } catch (error) {
      console.error(
        "Error fetching patient:",
        error
      );
      toast.error(
        "Failed to load patient profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">
          Patient not found
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {patient.name}
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              Age
            </p>
            <p className="text-lg font-medium text-gray-900">
              {patient.age || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Gender
            </p>
            <p className="text-lg font-medium text-gray-900">
              {patient.gender || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Blood Type
            </p>
            <p className="text-lg font-medium text-gray-900">
              {patient.bloodGroup || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Contact
            </p>
            <p className="text-lg font-medium text-gray-900">
              {patient.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() =>
            setTab("timeline")
          }
          className={`px-6 py-2 rounded-lg font-medium ${
            tab === "timeline"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Medical Timeline
        </button>
        <button
          onClick={() =>
            setTab("alerts")
          }
          className={`px-6 py-2 rounded-lg font-medium ${
            tab === "alerts"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Safety Alerts (
          {alerts.length})
        </button>
      </div>

      {/* Timeline Tab */}
      {tab === "timeline" && (
        <div className="space-y-4">
          {timeline.length > 0 ? (
            timeline.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900">
                    {event.type
                      .replace("_", " ")
                      .toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(
                      event.date
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-gray-700">
                  {event.type ===
                    "diagnosis" && (
                    <>
                      <p>
                        <strong>
                          Condition:
                        </strong>{" "}
                        {event.data.condition}
                      </p>
                      <p>
                        <strong>
                          Status:
                        </strong>{" "}
                        {event.data.status}
                      </p>
                      {event.data.notes && (
                        <p>
                          <strong>
                            Notes:
                          </strong>{" "}
                          {event.data.notes}
                        </p>
                      )}
                    </>
                  )}
                  {event.type ===
                    "medication" && (
                    <>
                      <p>
                        <strong>
                          Medication:
                        </strong>{" "}
                        {event.data.name}
                      </p>
                      <p>
                        <strong>
                          Dosage:
                        </strong>{" "}
                        {
                          event.data
                            .dosage
                        }
                      </p>
                      <p>
                        <strong>
                          Status:
                        </strong>{" "}
                        {event.data.status}
                      </p>
                    </>
                  )}
                  {event.type ===
                    "allergy" && (
                    <>
                      <p>
                        <strong>
                          Allergen:
                        </strong>{" "}
                        {event.data.allergen}
                      </p>
                      <p>
                        <strong>
                          Severity:
                        </strong>{" "}
                        <span
                          className={
                            event.data
                              .severity ===
                            "life-threatening"
                              ? "text-red-600 font-bold"
                              : "text-gray-600"
                          }
                        >
                          {
                            event.data
                              .severity
                          }
                        </span>
                      </p>
                      <p>
                        <strong>
                          Reaction:
                        </strong>{" "}
                        {event.data.reaction}
                      </p>
                    </>
                  )}
                  {event.type ===
                    "lab_result" && (
                    <>
                      <p>
                        <strong>
                          Test:
                        </strong>{" "}
                        {event.data.testName}
                      </p>
                      <p>
                        <strong>
                          Date:
                        </strong>{" "}
                        {new Date(
                          event.data
                            .testDate
                        ).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">
              No medical events recorded
            </p>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {tab === "alerts" && (
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const bgColor =
                alert.status ===
                "HIGH_RISK"
                  ? "bg-red-50 border-l-4 border-red-500"
                  : alert.status ===
                      "WARNING"
                    ? "bg-yellow-50 border-l-4 border-yellow-500"
                    : "bg-green-50 border-l-4 border-green-500";

              return (
                <div
                  key={alert._id}
                  className={`${bgColor} rounded-lg p-6`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900">
                      {alert.status}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        alert.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {alert.alerts.map(
                    (
                      singleAlert,
                      idx
                    ) => (
                      <div
                        key={idx}
                        className="mb-4 pb-4 border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900 mb-2">
                          {
                            singleAlert.type
                          }
                        </p>
                        <p className="text-gray-700 mb-2">
                          {
                            singleAlert.message
                          }
                        </p>
                        {singleAlert.evidence && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>
                              Evidence:
                            </strong>{" "}
                            {
                              singleAlert.evidence
                            }
                          </p>
                        )}
                        {singleAlert.recommendation && (
                          <p className="text-sm text-indigo-700 font-medium">
                            <strong>
                              Recommendation:
                            </strong>{" "}
                            {
                              singleAlert.recommendation
                            }
                          </p>
                        )}
                      </div>
                    )
                  )}

                  {alert.reviewed && (
                    <div className="mt-4 p-3 bg-gray-100 rounded">
                      <p className="text-sm text-gray-600">
                        <strong>
                          Review Status:
                        </strong>{" "}
                        Reviewed by doctor
                      </p>
                      {alert.reviewNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>
                            Notes:
                          </strong>{" "}
                          {alert.reviewNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
              <p className="text-green-700 font-medium">
                ✓ No safety alerts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
