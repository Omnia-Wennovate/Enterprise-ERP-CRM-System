'use client'

import React from 'react'

export function SkeletonLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="w-48 h-8 bg-muted rounded-lg mb-2" />
          <div className="w-96 h-4 bg-muted rounded-lg" />
        </div>
        <div className="w-40 h-10 bg-muted rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border h-24">
            <div className="w-8 h-8 bg-muted rounded-lg mb-3" />
            <div className="w-16 h-6 bg-muted rounded mb-1" />
            <div className="w-24 h-3 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      <div className="bg-card rounded-xl p-5 border border-border h-24" />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Smart Filters */}
          <div className="w-full h-10 bg-muted rounded-lg mb-6" />
          
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border h-40" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Health Score */}
          <div className="bg-card rounded-xl p-5 border border-border h-32" />
          {/* Upcoming */}
          <div className="bg-card rounded-xl p-5 border border-border h-48" />
        </div>
      </div>
    </div>
  )
}
