import { Inter } from "next/font/google";
import { useState, useRef, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function HeroButtons() {
  const [isApkDropdownOpen, setIsApkDropdownOpen] = useState(false);
  const apkDropdownRef = useRef<HTMLDivElement>(null);

  const toggleApkDropdown = () => {
    setIsApkDropdownOpen(!isApkDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        apkDropdownRef.current &&
        !apkDropdownRef.current.contains(event.target as Node)
      ) {
        setIsApkDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleApkDownload = (buildType: "production" | "development") => {
    // Handle APK download logic here
    console.log(`Downloading ${buildType} APK`);
    setIsApkDropdownOpen(false);

    const link = document.createElement("a");
    link.href = "/E-Noki.apk";
    link.download = "E-Noki.apk"; // optional, rename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="flex items-center justify-center space-x-6 mt-12">
      {/* Download APK Dropdown */}
      <div className="relative" ref={apkDropdownRef}>
        <button
          onClick={toggleApkDropdown}
          className="flex items-center space-x-3 px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-mono text-lg"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="7,10 12,15 17,10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className={`${inter.className} font-[700]`}>Download APK</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isApkDropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isApkDropdownOpen && (
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-2">
              {/* Production Build */}
              <button
                onClick={() => handleApkDownload("production")}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                {/* Android Logo */}
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-green-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.22C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">
                    E-Noki Production
                  </div>
                  <div className="text-sm text-gray-500">
                    Version 1.2.0 • Stable Release
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Optimized for production use
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </button>

              {/* Development Build */}
              <button
                onClick={() => handleApkDownload("development")}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                {/* Android Logo */}
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-orange-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.22C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">
                    E-Noki Development
                  </div>
                  <div className="text-sm text-gray-500">
                    Version 1.3.0-beta • Latest Features
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    For testing and development
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
