import React, {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";
import StatCard from "../../components/common/StatCard";
import Layout from "../../components/common/Layout";

const RECEPTION_LINKS = [
  { to: "/reception/dashboard", label: "Dashboard", icon: "🏥" },
  { to: "/reception/patients", label: "Patients", icon: "👥" },
  { to: "/reception/appointments", label: "Appointments", icon: "📅" },
  { to: "/reception/doctors", label: "Doctors", icon: "👨‍⚕️" },
  { to: "/reception/schedule", label: "Schedule", icon: "📆" },
  { to: "/reception/profile", label: "Profile", icon: "👤" },
];

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] =
    useState(true);
  const [dashboardData, setDashboardData] =
    useState({
      totalPatients: 0,
      todaysAppointmentsCount: 0,
      pendingAppointmentsCount: 0,
      availableDoctorsCount: 0,
      todaysAppointments: [],
      pendingAppointments: [],
      availableDoctors: [],
    });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData =
    async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem(
            "token"
          );
        const response =
          await axios.get(
            "/api/receptionist/dashboard",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (
          response.data.success
        ) {
          setDashboardData(
            response.data.data
          );
        }
      } catch (error) {
        console.error(
          "Error fetching dashboard:",
          error
        );
        toast.error(
          "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

  if (loading) {
    return <Layout links={RECEPTION_LINKS}><Spinner /></Layout>;
  }

  return (
    <Layout links={RECEPTION_LINKS}>
      <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Receptionist Dashboard
      </h1>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={
            dashboardData.totalPatients
          }
          color="blue"
        />
        <StatCard
          title="Today's Appointments"
          value={
            dashboardData.todaysAppointmentsCount
          }
          color="green"
        />
        <StatCard
          title="Pending Appointments"
          value={
            dashboardData.pendingAppointmentsCount
          }
          color="orange"
        />
        <StatCard
          title="Available Doctors"
          value={
            dashboardData.availableDoctorsCount
          }
          color="purple"
        />
      </div>

      {/* Action Buttons */}
      <div className="mb-8">
        <button
          onClick={() =>
            navigate(
              "/receptionist/register-patient"
            )
          }
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
        >
          Register New Patient
        </button>
        <button
          onClick={() =>
            navigate(
              "/receptionist/manage-appointments"
            )
          }
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium ml-4"
        >
          Manage Appointments
        </button>
        <button
          onClick={() =>
            navigate(
              "/receptionist/patients"
            )
          }
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium ml-4"
        >
          View All Patients
        </button>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Today's Appointments
        </h2>
        {dashboardData.todaysAppointments
          .length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.todaysAppointments.map(
                  (apt) => (
                    <tr
                      key={apt._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-gray-900">
                        {apt.patientId
                          ?.name ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {apt.doctorId
                          ?.name ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(
                          apt.date
                        ).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            apt.status ===
                            "confirmed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">
            No appointments today
          </p>
        )}
      </div>

      {/* Pending Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Pending Appointments
        </h2>
        {dashboardData.pendingAppointments
          .length > 0 ? (
          <div className="space-y-4">
            {dashboardData.pendingAppointments.map(
              (apt) => (
                <div
                  key={apt._id}
                  className="border-l-4 border-yellow-500 pl-4 py-2 hover:bg-gray-50 p-4 rounded transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {apt.patientId
                          ?.name ||
                          "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Requested:{" "}
                        {new Date(
                          apt.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/receptionist/appointment/${apt._id}`
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      Assign Doctor
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-gray-600">
            No pending appointments
          </p>
        )}
      </div>
      </div>
    </Layout>
  );
};

export default ReceptionistDashboard;
