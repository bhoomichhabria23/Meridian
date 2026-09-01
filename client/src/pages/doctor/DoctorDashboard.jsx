import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../components/common/Spinner";
import StatCard from "../components/common/StatCard";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] =
    useState({
      totalPatients: 0,
      todaysAppointmentsCount: 0,
      upcomingAppointmentsCount: 0,
      todaysAppointments: [],
      upcomingAppointments: [],
      recentPrescriptions: [],
    });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token");
      const response = await axios.get(
        "/api/doctors/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
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
    return <Spinner />;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Doctor Dashboard
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
          title="Upcoming Appointments"
          value={
            dashboardData.upcomingAppointmentsCount
          }
          color="orange"
        />
        <StatCard
          title="Recent Prescriptions"
          value={
            dashboardData.recentPrescriptions
              .length
          }
          color="purple"
        />
      </div>

      {/* Action Buttons */}
      <div className="mb-8">
        <button
          onClick={() =>
            navigate(
              "/doctor/search-patient"
            )
          }
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
        >
          Search Patient
        </button>
        <button
          onClick={() =>
            navigate(
              "/doctor/prescription/new"
            )
          }
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium ml-4"
        >
          New Prescription
        </button>
        <button
          onClick={() =>
            navigate("/doctor/chat")
          }
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium ml-4"
        >
          AI Assistant
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
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Contact
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
                          .name
                        }
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(
                          apt.date
                        ).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {apt.patientId
                          .phone
                        }
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

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Upcoming Appointments
        </h2>
        {dashboardData.upcomingAppointments
          .length > 0 ? (
          <div className="space-y-4">
            {dashboardData.upcomingAppointments.map(
              (apt) => (
                <div
                  key={apt._id}
                  className="border-l-4 border-indigo-500 pl-4 py-2"
                >
                  <p className="font-medium text-gray-900">
                    {apt.patientId.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(
                      apt.date
                    ).toLocaleDateString()} at{" "}
                    {new Date(
                      apt.date
                    ).toLocaleTimeString()}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-gray-600">
            No upcoming appointments
          </p>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
