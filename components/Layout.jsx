'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image';

export default function Layout({ children, activePage = 'leaderboard' }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#171717] rounded-2xl flex items-center justify-center">
              <Image src="/EGGS.svg" alt="EGGS Design" width={20} height={20} className="logo" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-[#171717]">EGGS Design</h1>
              <p className="hidden text-xs text-gray-600">Ping Pong ´25</p>
            </div>
          </div>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6 text-[#171717]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 w-80 h-screen z-40 pt-6 pb-6 pl-6
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="w-full h-full bg-[#171717] shadow-lg border border-gray-800 flex flex-col rounded-2xl">
        {/* Company Logo and Name */}
        <div className="p-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center">
              <Image src="/EGGS.svg" alt="EGGS Design" width={24} height={24} className="logo" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-white">EGGS Design</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-shrink-0">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/"
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors label-large ${
                  activePage === 'monthly-winners' 
                    ? 'bg-white bg-opacity-10 text-white border border-white border-opacity-20' 
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <span className="text-lg">🎯</span>
                <span>Monthly Challenges</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/rankings"
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors label-large ${
                  activePage === 'rankings' 
                    ? 'bg-white bg-opacity-10 text-white border border-white border-opacity-20' 
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <span className="text-lg">🏆</span>
                <span>Total Ranking</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/matches"
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors label-large ${
                  activePage === 'matches' 
                    ? 'bg-white bg-opacity-10 text-white border border-white border-opacity-20' 
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <span className="text-lg">📊</span>
                <span>All Matches</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 mt-auto flex-shrink-0">
          <p className="label-small text-gray-400 text-center">
            © 2025 Daan Hekking
          </p>
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80 pt-16 lg:pt-0">
        <div className="bg-[#F5F0E6] min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}
