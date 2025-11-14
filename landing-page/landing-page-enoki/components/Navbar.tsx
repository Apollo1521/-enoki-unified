import { Inter } from "next/font/google";
import { useState, useRef, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isApkDropdownOpen, setIsApkDropdownOpen] = useState(false);
  const [isMobileApkDropdownOpen, setIsMobileApkDropdownOpen] = useState(false);
  const apkDropdownRef = useRef<HTMLDivElement>(null);
  const mobileApkDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleApkDropdown = () => {
    setIsApkDropdownOpen(!isApkDropdownOpen);
  };

  const toggleMobileApkDropdown = () => {
    setIsMobileApkDropdownOpen(!isMobileApkDropdownOpen);
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
      if (
        mobileApkDropdownRef.current &&
        !mobileApkDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMobileApkDropdownOpen(false);
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
    setIsMobileApkDropdownOpen(false);

    const link = document.createElement("a");
    link.href = "/E-Noki.apk";
    link.download = "E-Noki.apk"; // optional, rename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <svg
              width="100"
              height="42"
              viewBox="0 0 263 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_4_10)">
                <path
                  d="M0 40.5801V5.20258C0 3.35278 0.317721 2.13884 0.953163 1.56077C1.58861 0.982712 2.83061 0.693678 4.67917 0.693678H44.712V8.15071H14.2108V16.4748H41.9392V23.8452H14.2108V33.1231H44.712V40.5801H0ZM50.0384 21.3306H74.3007V28.0939H50.0384V21.3306ZM81.9565 40.5801V5.54942C81.9565 3.52621 82.2452 2.22555 82.823 1.64748C83.4008 1.01161 84.7581 0.693678 86.8956 0.693678H100.327L119.217 26.1863L119.736 28.1806V0.693678H130.135C130.019 0.809289 129.932 1.18503 129.875 1.8209C129.875 2.39897 129.875 3.06374 129.875 3.81523C129.875 4.5089 129.875 5.14476 129.875 5.72284V36.3313C129.875 38.2389 129.47 39.4241 128.661 39.8864C127.853 40.3488 126.351 40.5801 124.156 40.5801H111.938L92.6146 14.5672L92.1813 12.3995V40.5801H81.9565ZM162.618 41.1871C157.997 41.1871 154.068 40.869 150.833 40.2333C147.599 39.5975 144.941 38.5279 142.861 37.025C140.84 35.4642 139.338 33.3543 138.356 30.6952C137.431 28.0361 136.969 24.6834 136.969 20.6369C136.969 16.4748 137.46 13.0932 138.442 10.4919C139.424 7.83276 140.955 5.75173 143.035 4.24877C145.172 2.688 147.858 1.58968 151.093 0.953807C154.386 0.317935 158.314 0 162.878 0C167.442 0 171.341 0.317935 174.576 0.953807C177.811 1.58968 180.439 2.688 182.461 4.24877C184.541 5.75173 186.043 7.83276 186.967 10.4919C187.949 13.151 188.44 16.5327 188.44 20.6369C188.44 24.7411 187.949 28.1228 186.967 30.7819C185.985 33.441 184.454 35.5509 182.374 37.1117C180.295 38.6146 177.609 39.6842 174.316 40.32C171.081 40.8981 167.182 41.1871 162.618 41.1871ZM162.705 33.8168C164.611 33.8168 166.257 33.6434 167.644 33.2965C169.088 32.8919 170.243 32.1982 171.11 31.2155C172.034 30.2328 172.698 28.9032 173.103 27.2268C173.565 25.4926 173.796 23.296 173.796 20.6369C173.796 17.92 173.565 15.7233 173.103 14.047C172.698 12.3128 172.034 10.9832 171.11 10.0583C170.243 9.07562 169.088 8.41084 167.644 8.064C166.257 7.65934 164.611 7.45703 162.705 7.45703C160.74 7.45703 159.036 7.65934 157.592 8.064C156.206 8.41084 155.079 9.07562 154.213 10.0583C153.346 10.9832 152.682 12.3128 152.22 14.047C151.758 15.7233 151.527 17.92 151.527 20.6369C151.527 23.296 151.758 25.4926 152.22 27.2268C152.682 28.9032 153.346 30.2328 154.213 31.2155C155.079 32.1982 156.206 32.8919 157.592 33.2965C159.036 33.6434 160.74 33.8168 162.705 33.8168ZM234.3 41.7073C232.625 41.7073 231.065 41.5339 229.621 41.1871C228.177 40.8402 226.848 40.2333 225.635 39.3662C225.231 39.0193 224.711 38.557 224.075 37.9788C223.44 37.4006 222.747 36.7649 221.996 36.0712C221.245 35.3196 220.465 34.5683 219.656 33.8168C218.905 33.0653 218.183 32.3427 217.49 31.649C216.797 30.9554 216.161 30.3484 215.583 29.8281C214.89 29.0766 214.284 28.4986 213.764 28.0939C213.302 27.6893 212.695 27.2557 211.944 26.7933L209.518 26.1863V40.5801H195.307V5.02916C195.307 4.10425 195.394 3.32387 195.567 2.688C195.74 2.05213 196.116 1.56077 196.694 1.21394C197.329 0.867097 198.398 0.693678 199.9 0.693678C201.517 0.693678 203.106 0.693678 204.665 0.693678C206.283 0.693678 207.9 0.693678 209.518 0.693678C209.518 1.56077 209.518 2.63019 209.518 3.90194C209.518 5.11587 209.518 6.41652 209.518 7.80387C209.518 9.13341 209.518 10.4341 209.518 11.7058C209.518 12.9197 209.518 13.9314 209.518 14.7406L211.944 14.2204C212.464 14.047 212.897 13.8157 213.244 13.5267C213.648 13.1799 214.139 12.7463 214.717 12.2261C215.41 11.4168 216.363 10.463 217.576 9.36465C218.79 8.20853 220.031 7.05238 221.302 5.89626C222.631 4.68232 223.757 3.6707 224.682 2.86142C226.01 1.8209 227.455 1.12723 229.014 0.780387C230.632 0.433549 232.538 0.260128 234.733 0.260128C236.409 0.260128 237.795 0.346839 238.893 0.520258C239.99 0.635873 241.146 0.809289 242.359 1.04052C242.243 1.09832 241.868 1.41626 241.232 1.99432C240.654 2.57239 239.99 3.20826 239.239 3.90194C238.546 4.5378 237.997 5.05805 237.593 5.46271C235.513 7.02348 233.318 8.67097 231.007 10.4052C228.697 12.1394 226.444 13.8735 224.249 15.6077C222.111 17.3419 220.176 19.0183 218.443 20.6369L218.53 16.6483C220.031 17.8622 221.736 19.2784 223.642 20.897C225.548 22.5156 227.599 24.2787 229.794 26.1863C231.989 28.0361 234.242 29.9437 236.553 31.9092C238.921 33.8747 241.29 35.7531 243.658 37.5453C243.37 37.95 242.792 38.4703 241.925 39.106C241.117 39.7418 240.077 40.32 238.806 40.8402C237.535 41.4184 236.033 41.7073 234.3 41.7073ZM248.513 40.5801C248.513 34.6838 248.513 28.7876 248.513 22.8914C248.513 16.9951 248.513 11.0988 248.513 5.20258C248.513 4.21988 248.571 3.41057 248.686 2.77471C248.86 2.08103 249.264 1.56077 249.899 1.21394C250.593 0.867097 251.69 0.693678 253.192 0.693678H262.724V40.5801H248.513Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_4_10">
                  <rect width="263" height="42" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors duration-200 text-sm">
              <span className={`${inter.className} font-[700]`}>
                View Paper
              </span>
            </button>

            {/* APK Download Dropdown */}
            <div className="relative" ref={apkDropdownRef}>
              <button
                onClick={toggleApkDropdown}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
              >
                <span className={`${inter.className} font-[700]`}>
                  Download APK
                </span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
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
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-6 space-y-4 bg-black/20 backdrop-blur-md rounded-lg mt-4">
            <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
              <span className={`${inter.className} font-[700]`}>
                View Paper
              </span>
            </button>

            <button className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
              <span className={`${inter.className} font-[700]`}>
                View Git History
              </span>
            </button>

            {/* Mobile APK Download Dropdown */}
            <div className="relative" ref={mobileApkDropdownRef}>
              <button
                onClick={toggleMobileApkDropdown}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <span className={`${inter.className} font-[700]`}>
                  Download APK
                </span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileApkDropdownOpen ? "rotate-180" : ""
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

              {/* Mobile Dropdown Menu */}
              {isMobileApkDropdownOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-2">
                    {/* Production Build */}
                    <button
                      onClick={() => handleApkDownload("production")}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      {/* Android Logo */}
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-green-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.22C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900 text-sm">
                          E-Noki Production
                        </div>
                        <div className="text-xs text-gray-500">
                          Version 1.2.0 • Stable
                        </div>
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
                          className="w-6 h-6 text-orange-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.22C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900 text-sm">
                          E-Noki Development
                        </div>
                        <div className="text-xs text-gray-500">
                          Version 1.3.0-beta • Latest
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
