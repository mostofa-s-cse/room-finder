'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { FaFacebookF, FaTwitter, FaInstagram, FaGithub, FaDiscord } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t">
      <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
          {/* Brand Section */}
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <Home className="h-7 w-7 me-3 text-blue-600" />
              <span className="text-gray-900 self-center text-2xl font-semibold whitespace-nowrap">
                RoomFinder
              </span>
            </Link>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            {/* Resources */}
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase">
                Resources
              </h2>
              <ul className="text-gray-600 font-medium">
                <li className="mb-4">
                  <Link href="/for-rent" className="hover:underline">
                    Browse Rooms
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/search" className="hover:underline">
                    Advanced Search
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/how-it-works" className="hover:underline">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:underline">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase">
                Follow us
              </h2>
              <ul className="text-gray-600 font-medium">
                <li className="mb-4">
                  <Link href="https://github.com/mostofa-s-cse" className="hover:underline">
                    Github
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/contact" className="hover:underline">
                    Contact Us
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/help" className="hover:underline">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:underline">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase">
                Legal
              </h2>
              <ul className="text-gray-600 font-medium">
                <li className="mb-4">
                  <Link href="/privacy" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:underline">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8" />

        {/* Bottom Section */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center">
            © 2024{' '}
            <Link href="/" className="hover:underline">
              RoomFinder™
            </Link>
            . All Rights Reserved.
          </span>

          {/* Social Media Icons */}
          <div className="flex mt-4 sm:justify-center sm:mt-0">
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <FaFacebookF className="w-5 h-5" />
              <span className="sr-only">Facebook page</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 ms-5">
              <FaDiscord className="w-5 h-5" />
              <span className="sr-only">Discord community</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 ms-5">
              <FaTwitter className="w-5 h-5" />
              <span className="sr-only">Twitter page</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 ms-5">
              <FaInstagram className="w-5 h-5" />
              <span className="sr-only">Instagram page</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900 ms-5">
              <FaGithub className="w-5 h-5" />
              <span className="sr-only">GitHub account</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}