import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Search,
  SlidersHorizontal,
  Download,
  Printer,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  ScanLine,
  HeartPulse,
  File,
  UserRound,
  CalendarDays,
  Loader2,
  AlertCircle,
  X,
  Eye,
} from "lucide-react";

const API_URL = "http://localhost:5000";

function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportIcon({ type }) {
  const value = type?.toLowerCase();

  if (value === "lab") {
    return <FlaskConical size={19} />;
  }

  if (value === "imaging") {
    return <ScanLine size={19} />;
  }

  if (value === "cardiology") {
    return <HeartPulse size={19} />;
  }

  return <FileText size={19} />;
}

function ReportListItem({
  report,
  selected,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(report)}
      className={`grid w-full grid-cols-1 gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 lg:grid-cols-[2fr_0.8fr_1fr_1.5fr_0.8fr_auto] lg:items-center ${
        selected
          ? "bg-green-50/50"
          : "bg-white hover:bg-slate-50"
      }`}
    >
      {/* REPORT */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <ReportIcon type={report.type} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {report.name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {report.testName || report.description || "Health report"}
          </p>
        </div>
      </div>

      {/* TYPE */}
      <div>
        <span className="inline-flex rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
          {report.type || "Other"}
        </span>
      </div>

      {/* DATE */}
      <div>
        <p className="text-sm font-medium text-slate-700">
          {report.date
            ? new Date(report.date).toLocaleDateString("en-IN")
            : "-"}
        </p>

        {report.date && (
          <p className="mt-1 text-xs text-slate-400">
            {new Date(report.date).toLocaleTimeString(
              "en-IN",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </p>
        )}
      </div>

      {/* DOCTOR */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
          {report.doctor?.image ? (
            <img
              src={report.doctor.image}
              alt={report.doctor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound
              size={17}
              className="text-slate-500"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700">
            {report.doctor?.name || "Not specified"}
          </p>

          <p className="truncate text-xs text-slate-400">
            {report.doctor?.specialization || ""}
          </p>
        </div>
      </div>

      {/* STATUS */}
      <div>
        <span
          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
            report.status === "normal"
              ? "bg-green-50 text-green-700"
              : report.status === "abnormal"
                ? "bg-red-50 text-red-600"
                : report.status === "completed"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-100 text-slate-600"
          }`}
        >
          {report.status || "Pending"}
        </span>
      </div>

      <div className="hidden lg:block">
        <span className="text-slate-400">
          ⋮
        </span>
      </div>
    </button>
  );
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [page, setPage] = useState(1);

  const fileInputRef = useRef(null);

  const reportsPerPage = 6;

  /*
   * FETCH REPORTS
   */
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/reports`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();

      const reportList = Array.isArray(data)
        ? data
        : data.reports || [];

      setReports(reportList);

      if (reportList.length > 0) {
        setSelectedReport(reportList[0]);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * UPLOAD REPORT
   */
  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("file", file);

      /*
       * Backend automatically associates
       * the report with the logged-in patient.
       */

      const response = await fetch(
        `${API_URL}/api/reports/upload`,
        {
          method: "POST",
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Upload failed"
        );
      }

      await fetchReports();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to upload report."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /*
   * DELETE REPORT
   */
  const deleteReport = async () => {
    if (!selectedReport) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/reports/${selectedReport._id}`,
        {
          method: "DELETE",
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to delete report"
        );
      }

      setSelectedReport(null);

      await fetchReports();
    } catch (err) {
      console.error(err);

      setError(
        "Unable to delete this report."
      );
    }
  };

  /*
   * SEARCH + FILTER
   */
  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (category !== "all") {
      result = result.filter(
        (report) =>
          report.type?.toLowerCase() ===
          category.toLowerCase()
      );
    }

    const query = search
      .toLowerCase()
      .trim();

    if (query) {
      result = result.filter((report) => {
        return (
          report.name
            ?.toLowerCase()
            .includes(query) ||
          report.testName
            ?.toLowerCase()
            .includes(query) ||
          report.type
            ?.toLowerCase()
            .includes(query) ||
          report.doctor?.name
            ?.toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [reports, search, category]);

  /*
   * PAGINATION
   */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReports.length /
        reportsPerPage
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (currentPage - 1) *
    reportsPerPage;

  const currentReports =
    filteredReports.slice(
      startIndex,
      startIndex + reportsPerPage
    );

  /*
   * STATISTICS
   */
  const totalReports = reports.length;

  const labReports = reports.filter(
    (report) =>
      report.type?.toLowerCase() === "lab"
  ).length;

  const imagingReports = reports.filter(
    (report) =>
      report.type?.toLowerCase() ===
      "imaging"
  ).length;

  const otherReports = reports.filter(
    (report) => {
      const type =
        report.type?.toLowerCase();

      return (
        type !== "lab" &&
        type !== "imaging"
      );
    }
  ).length;

  /*
   * PREVIEW
   */
  const isPDF =
    selectedReport?.fileType ===
      "application/pdf" ||
    selectedReport?.fileUrl
      ?.toLowerCase()
      .endsWith(".pdf");

  /*
   * DOWNLOAD
   */
  const handleDownload = () => {
    if (!selectedReport?.fileUrl) return;

    const link =
      document.createElement("a");

    link.href =
      selectedReport.fileUrl;

    link.target = "_blank";
    link.download =
      selectedReport.name || "report";

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  /*
   * PRINT
   */
  const handlePrint = () => {
    if (!selectedReport?.fileUrl) return;

    const printWindow =
      window.open(
        selectedReport.fileUrl,
        "_blank"
      );

    if (!printWindow) return;

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  /*
   * SHARE
   */
  const handleShare = async () => {
    if (!selectedReport?.fileUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            selectedReport.name,
          url:
            selectedReport.fileUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          selectedReport.fileUrl
        );

        alert(
          "Report link copied to clipboard."
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] text-slate-900">

      {/* YOUR EXISTING HORIZONTAL NAVBAR
          IS NOT INCLUDED */}

      <main>

        {/* HERO */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1500px]">

            <div className="relative min-h-[285px] overflow-hidden bg-[#eef8f1]">

              <img
                src="/images/reports-hero.jpg"
                alt="Medical reports"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#eef8f1] via-[#eef8f1]/90 to-transparent" />

              <div className="relative z-10 flex min-h-[285px] items-center px-6 py-10 sm:px-10 lg:px-14">

                <div className="max-w-lg">

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-green-700">
                    <FileText size={14} />
                    Health Reports
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-[#123c2b] sm:text-5xl">
                    Reports
                  </h1>

                  <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                    View, upload and manage your health
                    reports securely in one place.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Upload size={18} />
                    )}

                    {uploading
                      ? "Uploading..."
                      : "Upload Report"}
                  </button>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">

          {/* ERROR */}
          {error && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">

              <div className="flex items-center gap-3">
                <AlertCircle
                  size={19}
                  className="text-red-500"
                />

                <p className="text-sm text-red-600">
                  {error}
                </p>
              </div>

              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon={<FileText size={23} />}
              title="Total Reports"
              value={totalReports}
              subtitle="All time"
            />

            <StatCard
              icon={<FlaskConical size={23} />}
              title="Lab Reports"
              value={labReports}
              subtitle="All time"
            />

            <StatCard
              icon={<ScanLine size={23} />}
              title="Imaging Reports"
              value={imagingReports}
              subtitle="All time"
            />

            <StatCard
              icon={<File size={23} />}
              title="Other Reports"
              value={otherReports}
              subtitle="All time"
            />

          </div>

          {/* MAIN */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[190px_minmax(0,1fr)_430px]">

            {/* CATEGORY */}
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <h3 className="px-2 text-sm font-semibold text-slate-900">
                Categories
              </h3>

              <div className="mt-4 space-y-1">

                {[
                  {
                    key: "all",
                    label: "All Reports",
                    icon: <FileText size={17} />,
                  },
                  {
                    key: "lab",
                    label: "Lab Reports",
                    icon: <FlaskConical size={17} />,
                  },
                  {
                    key: "imaging",
                    label: "Imaging Reports",
                    icon: <ScanLine size={17} />,
                  },
                  {
                    key: "cardiology",
                    label: "Cardiology",
                    icon: <HeartPulse size={17} />,
                  },
                  {
                    key: "pathology",
                    label: "Pathology",
                    icon: <FlaskConical size={17} />,
                  },
                  {
                    key: "radiology",
                    label: "Radiology",
                    icon: <ScanLine size={17} />,
                  },
                  {
                    key: "other",
                    label: "Others",
                    icon: <File size={17} />,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCategory(item.key);
                      setPage(1);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      category === item.key
                        ? "bg-green-50 text-green-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.icon}

                    <span>
                      {item.label}
                    </span>
                  </button>
                ))}

              </div>
            </aside>

            {/* REPORT LIST */}
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 pt-5 md:flex-row md:items-center md:justify-between">

                <h2 className="text-lg font-semibold text-slate-900">
                  All Reports
                </h2>

                <div className="flex gap-2 pb-4">

                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(
                          e.target.value
                        );
                        setPage(1);
                      }}
                      placeholder="Search reports..."
                      className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:w-56"
                    />
                  </div>

                  <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:border-green-300 hover:text-green-700">
                    <SlidersHorizontal
                      size={17}
                    />

                    <span className="hidden sm:inline">
                      Filter
                    </span>
                  </button>

                </div>
              </div>

              {/* COLUMN HEADER */}
              <div className="hidden grid-cols-[2fr_0.8fr_1fr_1.5fr_0.8fr_auto] border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
                <span>Report</span>
                <span>Type</span>
                <span>Date</span>
                <span>Ordered By</span>
                <span>Status</span>
                <span />
              </div>

              {/* LOADING */}
              {loading && (
                <div className="flex min-h-[450px] items-center justify-center">

                  <div className="flex items-center gap-3 text-green-700">
                    <Loader2
                      size={22}
                      className="animate-spin"
                    />

                    <span className="text-sm font-medium">
                      Loading reports...
                    </span>
                  </div>

                </div>
              )}

              {/* EMPTY */}
              {!loading &&
                currentReports.length === 0 && (
                  <div className="flex min-h-[450px] flex-col items-center justify-center px-5 text-center">

                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <FileText size={28} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-900">
                      No reports found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Upload a report or change your
                      search/filter.
                    </p>

                  </div>
                )}

              {/* REPORTS */}
              {!loading &&
                currentReports.length > 0 && (
                  <>
                    {currentReports.map(
                      (report) => (
                        <ReportListItem
                          key={report._id}
                          report={report}
                          selected={
                            selectedReport?._id ===
                            report._id
                          }
                          onSelect={
                            setSelectedReport
                          }
                        />
                      )
                    )}

                    {/* PAGINATION */}
                    <div className="flex items-center justify-center gap-2 border-t border-slate-100 p-5">

                      <button
                        disabled={currentPage === 1}
                        onClick={() =>
                          setPage(
                            (prev) =>
                              prev - 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"
                      >
                        <ChevronLeft
                          size={17}
                        />
                      </button>

                      {Array.from(
                        {
                          length: totalPages,
                        },
                        (_, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              setPage(
                                index + 1
                              )
                            }
                            className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                              currentPage ===
                              index + 1
                                ? "bg-green-600 text-white"
                                : "text-slate-600 hover:bg-green-50"
                            }`}
                          >
                            {index + 1}
                          </button>
                        )
                      )}

                      <button
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        onClick={() =>
                          setPage(
                            (prev) =>
                              prev + 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"
                      >
                        <ChevronRight
                          size={17}
                        />
                      </button>

                    </div>
                  </>
                )}

            </div>

            {/* DETAILS */}
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">

              {selectedReport ? (
                <div className="p-5">

                  {/* HEADER */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-5">

                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Report Details
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        {selectedReport.reportId ||
                          selectedReport._id}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedReport(null)
                      }
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={18} />
                    </button>

                  </div>

                  {/* REPORT TITLE */}
                  <div className="mt-5 flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <ReportIcon
                        type={
                          selectedReport.type
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <h3 className="font-semibold text-slate-900">
                        {selectedReport.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedReport.testName ||
                          selectedReport.description ||
                          selectedReport.type}
                      </p>

                    </div>

                    <span
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                        selectedReport.status ===
                        "normal"
                          ? "bg-green-50 text-green-700"
                          : selectedReport.status ===
                              "abnormal"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {selectedReport.status ||
                        "Pending"}
                    </span>

                  </div>

                  {/* META */}
                  <div className="mt-5 grid grid-cols-2 gap-4 border-b border-slate-100 pb-5">

                    <div>
                      <p className="text-xs text-slate-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {selectedReport.date
                          ? new Date(
                              selectedReport.date
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Report ID
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-slate-700">
                        {selectedReport.reportId ||
                          selectedReport._id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Ordered By
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {selectedReport.doctor
                          ?.name ||
                          "Not specified"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {selectedReport.doctor
                          ?.specialization ||
                          ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Lab / Center
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {selectedReport.labName ||
                          "Not specified"}
                      </p>
                    </div>

                  </div>

                  {/* PATIENT */}
                  <div className="mt-5 rounded-xl bg-green-50/60 p-4">

                    <div className="flex items-center gap-2">
                      <UserRound
                        size={17}
                        className="text-green-700"
                      />

                      <p className="text-sm font-semibold text-green-800">
                        Patient
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4">

                      <div>
                        <p className="text-xs text-slate-400">
                          Name
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {selectedReport.patient
                            ?.name ||
                            "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Patient ID
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {selectedReport.patient
                            ?.patientId ||
                            "-"}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* PREVIEW */}
                  <div className="mt-5">

                    <div className="mb-3 flex items-center justify-between">

                      <h3 className="font-semibold text-slate-900">
                        Report Preview
                      </h3>

                      {selectedReport.fileUrl && (
                        <a
                          href={
                            selectedReport.fileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"
                        >
                          <Eye size={14} />
                          Open
                        </a>
                      )}

                    </div>

                    <div className="h-[250px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                      {selectedReport.fileUrl ? (
                        isPDF ? (
                          <iframe
                            src={
                              selectedReport.fileUrl
                            }
                            title="Report preview"
                            className="h-full w-full"
                          />
                        ) : (
                          <img
                            src={
                              selectedReport.fileUrl
                            }
                            alt={
                              selectedReport.name
                            }
                            className="h-full w-full object-contain"
                          />
                        )
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-center">

                          <FileText
                            size={36}
                            className="text-slate-300"
                          />

                          <p className="mt-3 text-sm text-slate-500">
                            Preview not available
                          </p>

                        </div>
                      )}

                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 grid grid-cols-3 gap-2">

                    <button
                      onClick={
                        handleDownload
                      }
                      disabled={
                        !selectedReport.fileUrl
                      }
                      className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-3 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download size={15} />
                      Download
                    </button>

                    <button
                      onClick={handlePrint}
                      disabled={
                        !selectedReport.fileUrl
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border border-green-200 px-3 py-3 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-40"
                    >
                      <Printer size={15} />
                      Print
                    </button>

                    <button
                      onClick={handleShare}
                      disabled={
                        !selectedReport.fileUrl
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border border-green-200 px-3 py-3 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-40"
                    >
                      <Share2 size={15} />
                      Share
                    </button>

                  </div>

                  {/* DELETE */}
                  <button
                    onClick={deleteReport}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Delete Report
                  </button>

                </div>
              ) : (
                <div className="flex min-h-[600px] flex-col items-center justify-center p-5 text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <FileText size={28} />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    Select a report
                  </h3>

                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    Select a report from the list to
                    view its details and preview.
                  </p>

                </div>
              )}

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}