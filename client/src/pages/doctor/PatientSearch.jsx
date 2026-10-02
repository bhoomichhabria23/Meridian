import React, {
  useState,
  useEffect,
} from "react";
import {
  useNavigate,
} from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Spinner from "../../components/common/Spinner";

const PatientSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] =
    useState("");
  const [results, setResults] =
    useState([]);
  const [loading, setLoading] =
    useState(false);
  const [hasSearched, setHasSearched] =
    useState(false);

  const handleSearch = async (
    e
  ) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error(
        "Please enter a search term"
      );
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response =
        await api.get(
          `/api/doctors/patients/search?query=${encodeURIComponent(searchQuery)}`
        );

      if (
        response.data.success
      ) {
        setResults(
          response.data.data || []
        );
      }
    } catch (error) {
      console.error(
        "Search error:",
        error
      );
      toast.error(
        "Failed to search patients"
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() =>
            navigate(
              "/doctor/dashboard"
            )
          }
          className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-2 mb-4"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Search Patients
        </h1>
        <p className="text-gray-600">
          Search by name, email, phone, or
          patient ID
        </p>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <div className="flex space-x-4">
          <input
            type="text"
            value={
              searchQuery
            }
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            placeholder="Enter patient name, email, phone, or ID..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition"
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <Spinner />
      ) : hasSearched ? (
        results.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Age
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Gender
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(
                    (patient) => (
                      <tr
                        key={patient._id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {patient.name ||
                            patient.userId
                              ?.name ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {patient.email ||
                            patient.userId
                              ?.email ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {patient.phone ||
                            patient.userId
                              ?.phone ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {patient.age ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {patient.gender ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              navigate(
                                `/doctor/patient/${patient._id}`
                              )
                            }
                            className="text-indigo-600 hover:text-indigo-700 font-medium transition"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">
              No patients found matching
              "{searchQuery}"
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              Try a different search
              term
            </p>
          </div>
        )
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 font-medium">
            Enter a search term to
            find patients
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
