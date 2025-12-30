'use client';

import { useState, useMemo } from 'react';
import reportsData from '@/data/reports.json';
import { Report, ReportsData } from '@/types/report';

const data = reportsData as ReportsData;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'monthly' | 'quarterly'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique years from reports
  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.reports.map(r => r.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, []);

  // Filter reports based on selections
  const filteredReports = useMemo(() => {
    return data.reports.filter(report => {
      // Year filter
      if (selectedYear !== 'all' && report.year !== selectedYear) return false;

      // Type filter
      if (selectedType !== 'all' && report.type !== selectedType) return false;

      // Search filter - searches full content
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        // Strip HTML tags from content for searching
        const plainText = report.html.replace(/<[^>]*>/g, ' ');
        const searchableText = `${report.title} ${plainText} ${MONTH_NAMES[report.month]}`.toLowerCase();

        // Split query into words and check if ALL words are found
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        const allWordsFound = queryWords.every(word => searchableText.includes(word));
        if (!allWordsFound) return false;
      }

      return true;
    });
  }, [selectedYear, selectedType, searchQuery]);

  // Group reports by year for display
  const reportsByYear = useMemo(() => {
    const grouped: Record<number, Report[]> = {};
    for (const report of filteredReports) {
      if (!grouped[report.year]) grouped[report.year] = [];
      grouped[report.year].push(report);
    }
    return grouped;
  }, [filteredReports]);

  const sortedYears = Object.keys(reportsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero section */}
      <div className="text-center mb-2">
        <img
          src="/vaill-logo.png"
          alt="VAILL - Vanderbilt AI Law Lab"
          className="h-80 mx-auto"
        />
        <p className="text-gray-500 text-sm">
          {data.totalReports} reports · October 2023 – present
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CFAE70] focus:border-transparent"
            />
          </div>

          {/* Year filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CFAE70]"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'monthly' | 'quarterly')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CFAE70]"
            >
              <option value="all">All Types</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredReports.length} of {data.totalReports} reports
        </div>
      </div>

      {/* Timeline */}
      {sortedYears.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No reports match your search criteria.
        </div>
      ) : (
        <div className="space-y-12">
          {sortedYears.map(year => (
            <div key={year}>
              {/* Year header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">{year}</h2>
                <div className="flex-1 h-px bg-[#CFAE70]"></div>
                <span className="text-sm text-gray-500">
                  {reportsByYear[year].length} report{reportsByYear[year].length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Reports grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reportsByYear[year].map(report => (
                  <a
                    key={report.slug}
                    href={`/report/${report.slug}`}
                    className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#CFAE70] hover:shadow-md transition-all group"
                  >
                    {/* Report type badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          report.type === 'quarterly'
                            ? 'bg-[#CFAE70] text-black'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {report.type === 'quarterly' ? 'Quarterly' : 'Monthly'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {MONTH_NAMES[report.month]} {report.year}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-[#997A3D] transition-colors">
                      {report.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {report.excerpt.replace('...', '')}
                    </p>

                    {/* Read more */}
                    <div className="mt-3 text-sm font-medium text-[#997A3D] group-hover:text-[#CFAE70]">
                      Read full report →
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
