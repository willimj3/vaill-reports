import reportsData from '@/data/reports.json';
import { ReportsData } from '@/types/report';
import { notFound } from 'next/navigation';

const data = reportsData as ReportsData;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate static paths for all reports
export function generateStaticParams() {
  return data.reports.map((report) => ({
    slug: report.slug,
  }));
}

// Generate metadata for each report
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const report = data.reports.find((r) => r.slug === slug);
    if (!report) {
      return { title: 'Report Not Found' };
    }
    return {
      title: `${report.title} | VAILL Reports`,
      description: report.excerpt,
    };
  });
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = data.reports.find((r) => r.slug === slug);

  if (!report) {
    notFound();
  }

  // Find previous and next reports
  const currentIndex = data.reports.findIndex((r) => r.slug === slug);
  const prevReport = currentIndex < data.reports.length - 1 ? data.reports[currentIndex + 1] : null;
  const nextReport = currentIndex > 0 ? data.reports[currentIndex - 1] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <a
        href="/"
        className="inline-flex items-center text-sm text-gray-600 hover:text-[#997A3D] mb-8"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all reports
      </a>

      {/* Report header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`text-sm font-medium px-3 py-1 rounded ${
              report.type === 'quarterly'
                ? 'bg-[#CFAE70] text-black'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {report.type === 'quarterly' ? 'Quarterly Report' : 'Monthly Update'}
          </span>
          <span className="text-gray-500">
            {MONTH_NAMES[report.month]} {report.year}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-2">{report.title}</h1>

        <div className="text-sm text-gray-400">
          Source: {report.sourceFile}
        </div>
      </div>

      {/* Report content */}
      <article
        className="report-content prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: report.html }}
      />

      {/* Navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex justify-between items-center">
          {prevReport ? (
            <a
              href={`/report/${prevReport.slug}`}
              className="flex items-center text-gray-600 hover:text-[#997A3D] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-400">Previous</div>
                <div className="font-medium">{prevReport.title}</div>
              </div>
            </a>
          ) : (
            <div />
          )}

          {nextReport ? (
            <a
              href={`/report/${nextReport.slug}`}
              className="flex items-center text-gray-600 hover:text-[#997A3D] transition-colors text-right"
            >
              <div className="text-right">
                <div className="text-xs text-gray-400">Next</div>
                <div className="font-medium">{nextReport.title}</div>
              </div>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
