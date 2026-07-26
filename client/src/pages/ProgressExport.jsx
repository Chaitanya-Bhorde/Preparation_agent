import { useState, useEffect } from 'react';
import { exportProgress } from '../api';
import { useAuth } from '../context/AuthContext';
import { Download, FileText, Loader2, CheckCircle, BarChart3, Award, TrendingUp, BookOpen, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAGE_CONTAINER, LOADING_SPINNER, CARD_CLASSES } from '../utils/ui';

export default function ProgressExport() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: res } = await exportProgress();
      setData(res.data);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      // Generate HTML for the PDF
      const html = generateHTML(data);
      
      // Create a Blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PrepAgent_Progress_${user?.name?.replace(/\s+/g, '_') || 'Report'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Progress report downloaded! Open in browser and print as PDF.');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setExporting(false);
    }
  };

  const generateHTML = (d) => {
    if (!d) return '';
    
    const topicRows = d.topicPerformance?.map(t => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333;color:#e0e0e0">${t.topic}</td>
        <td style="padding:8px;border-bottom:1px solid #333;color:#e0e0e0;text-align:center">${t.solved}/${t.total}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">
          <span style="color:${t.successRate >= 70 ? '#4ade80' : t.successRate >= 40 ? '#facc15' : '#f87171'}">${t.successRate}%</span>
        </td>
      </tr>
    `).join('') || '';

    const companyRows = d.companyPerformance?.map(c => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333;color:#e0e0e0">${c.company}</td>
        <td style="padding:8px;border-bottom:1px solid #333;color:#e0e0e0;text-align:center">${c.solved}/${c.total}</td>
      </tr>
    `).join('') || '';

    const recentSubs = d.recentSubmissions?.slice(0, 10).map(s => `
      <tr>
        <td style="padding:6px;border-bottom:1px solid #333;color:#e0e0e0">${s.title}</td>
        <td style="padding:6px;border-bottom:1px solid #333;color:#e0e0e0;text-align:center">${s.difficulty}</td>
        <td style="padding:6px;border-bottom:1px solid #333;text-align:center">
          <span style="color:${s.status === 'accepted' ? '#4ade80' : '#f87171'}">${s.status}</span>
        </td>
        <td style="padding:6px;border-bottom:1px solid #333;color:#e0e0e0;text-align:center">${new Date(s.date).toLocaleDateString()}</td>
      </tr>
    `).join('') || '';

    return `<!DOCTYPE html>
<html>
<head><title>PrepAgent Progress Report</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f1115; color: #e0e0e0; padding: 40px; }
  .header { text-align: center; margin-bottom: 40px; }
  .header h1 { color: #60a5fa; font-size: 28px; margin-bottom: 5px; }
  .header p { color: #6b7280; font-size: 14px; }
  .section { background: #1a1d21; border: 1px solid #2d2d2d; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .section h2 { color: #60a5fa; font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid #2d2d2d; padding-bottom: 8px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: #1a1d21; border: 1px solid #2d2d2d; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-card .value { font-size: 24px; font-weight: bold; color: #60a5fa; }
  .stat-card .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 8px; border-bottom: 2px solid #333; color: #6b7280; font-size: 12px; text-align: left; }
  .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 40px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
</style></head>
<body>
  <div class="header">
    <h1>📊 PrepAgent Progress Report</h1>
    <p>Generated on ${new Date(d.exportedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>👤 Student Profile</h2>
    <p><strong>Name:</strong> ${d.user.name}</p>
    <p><strong>Email:</strong> ${d.user.email}</p>
    <p><strong>College:</strong> ${d.user.college || 'N/A'}</p>
    <p><strong>Branch:</strong> ${d.user.branch || 'N/A'} | <strong>Year:</strong> ${d.user.year || 'N/A'} | <strong>CGPA:</strong> ${d.user.cgpa || 'N/A'}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="value">${d.stats.totalSolved}</div><div class="label">Total Solved</div></div>
    <div class="stat-card"><div class="value">${d.stats.acceptanceRate}%</div><div class="label">Acceptance Rate</div></div>
    <div class="stat-card"><div class="value">${d.stats.streak}</div><div class="label">Day Streak</div></div>
    <div class="stat-card"><div class="value">${d.stats.atsScore}</div><div class="label">ATS Score</div></div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="value">${d.stats.easySolved}</div><div class="label">Easy</div></div>
    <div class="stat-card"><div class="value">${d.stats.mediumSolved}</div><div class="label">Medium</div></div>
    <div class="stat-card"><div class="value">${d.stats.hardSolved}</div><div class="label">Hard</div></div>
    <div class="stat-card"><div class="value">${d.stats.totalSubmissions}</div><div class="label">Total Submissions</div></div>
  </div>

  ${topicRows ? `
  <div class="section">
    <h2>📚 Topic Performance</h2>
    <table>
      <tr><th>Topic</th><th style="text-align:center">Solved</th><th style="text-align:center">Success Rate</th></tr>
      ${topicRows}
    </table>
  </div>` : ''}

  ${companyRows ? `
  <div class="section">
    <h2>🏢 Company-wise Progress</h2>
    <table>
      <tr><th>Company</th><th style="text-align:center">Solved</th></tr>
      ${companyRows}
    </table>
  </div>` : ''}

  ${recentSubs ? `
  <div class="section">
    <h2>📝 Recent Submissions</h2>
    <table>
      <tr><th>Problem</th><th style="text-align:center">Difficulty</th><th style="text-align:center">Status</th><th style="text-align:center">Date</th></tr>
      ${recentSubs}
    </table>
  </div>` : ''}

  <div class="footer">
    <p>Generated by PrepAgent - Your Placement Preparation Companion</p>
    <p>This report showcases your preparation progress for campus placements</p>
  </div>
</body></html>`;
  };

  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8" /> Progress Report
        </h1>
        <p className="text-purple-100">Download your preparation progress as a professional report</p>
      </div>

      {data && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
              <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{data.stats.totalSolved}</p>
              <p className="text-gray-400 text-xs">Total Solved</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
              <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{data.stats.acceptanceRate}%</p>
              <p className="text-gray-400 text-xs">Acceptance Rate</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
              <TrendingUp className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{data.stats.streak}d</p>
              <p className="text-gray-400 text-xs">Streak</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
              <Award className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{data.stats.atsScore}</p>
              <p className="text-gray-400 text-xs">ATS Score</p>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-green-400 text-lg font-bold">{data.stats.easySolved}</p>
              <p className="text-gray-500 text-xs">Easy</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-yellow-400 text-lg font-bold">{data.stats.mediumSolved}</p>
              <p className="text-gray-500 text-xs">Medium</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-red-400 text-lg font-bold">{data.stats.hardSolved}</p>
              <p className="text-gray-500 text-xs">Hard</p>
            </div>
          </div>

          {/* Topic Performance */}
          {data.topicPerformance?.length > 0 && (
            <div className={CARD_CLASSES + ' mb-6'}>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" /> Topic Performance
              </h2>
              <div className="space-y-2">
                {data.topicPerformance.map((t) => (
                  <div key={t.topic} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{t.topic}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs">{t.solved}/{t.total}</span>
                      <span className={`text-xs font-bold ${t.successRate >= 70 ? 'text-green-400' : t.successRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {t.successRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Performance */}
          {data.companyPerformance?.length > 0 && (
            <div className={CARD_CLASSES + ' mb-6'}>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" /> Company-wise Progress
              </h2>
              <div className="space-y-2">
                {data.companyPerformance.map((c) => (
                  <div key={c.company} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{c.company}</span>
                    <span className="text-gray-400 text-sm">{c.solved}/{c.total} solved</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="text-center">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {exporting ? 'Generating...' : 'Download Progress Report'}
            </button>
            <p className="text-gray-500 text-xs mt-2">Downloads as HTML - open in browser and use Ctrl+P to save as PDF</p>
          </div>
        </>
      )}
    </div>
  );
}