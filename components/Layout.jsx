'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image';

export default function Layout({ children, activePage = 'leaderboard' }) {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-screen z-10">
        {/* Company Logo and Name */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Image src="/EGGS.svg" alt="EGGS Design" width={24} height={24} className="logo" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EGGS Design</h1>
              <p className="text-sm text-gray-600">Ping Pong ´25</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-shrink-0">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activePage === 'leaderboard' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">🏆</span>
                <span className="font-medium">Leaderboard</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/matches"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activePage === 'matches' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">📊</span>
                <span className="font-medium">All Matches</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 mt-auto flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Daan Hekking
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 overflow-auto">
        {children}
      </div>
    </div>
  )
}
