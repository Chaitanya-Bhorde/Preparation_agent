import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCoreSubject, getCoreSubjectNotes, getCoreSubjectMCQs, getCoreSubjectInterviewQuestions, submitCoreMCQAttempt, getCoreSubjectProgress } from '../api';
import { PAGE_CONTAINER, LOADING_SPINNER, DIFFICULTY_COLORS } from '../utils/ui';
import { ArrowLeft, BookOpen, HelpCircle, MessageSquare, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, Target, TrendingUp } from 'lucide-react';

export default function SubjectDetail() {
  const { subjectSlug } = useParams();
  const [subject, setSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [interviewQs, setInterviewQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mcqFilter, setMcqFilter] = useState({ difficulty: '', topic: '' });
  const [interviewFilter, setInterviewFilter] = useState({ difficulty: '', topic: '' });
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [mcqSolutions, setMcqSolutions] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [progress, setProgress] = useState(null);
  useEffect(() => { loadSubject(); }, [subjectSlug]);
  useEffect(() => { if (activeTab === 'mcqs') loadMCQs(); if (activeTab === 'interview') loadInterviewQs(); }, [activeTab, mcqFilter, interviewFilter]);
  const loadSubject = async () => { setLoading(true); try { const { data } = await getCoreSubject(subjectSlug); setSubject(data.data); const n = await getCoreSubjectNotes(subjectSlug); setNotes(n.data.data || []); const p = await getCoreSubjectProgress(subjectSlug); setProgress(p.data.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const loadMCQs = async () => { try { const p = {}; if (mcqFilter.difficulty) p.difficulty = mcqFilter.difficulty; if (mcqFilter.topic) p.topic = mcqFilter.topic; const { data } = await getCoreSubjectMCQs(subjectSlug, p); setMcqs(data.data || []); } catch (e) { console.error(e); } };
  const loadInterviewQs = async () => { try { const p = {}; if (interviewFilter.difficulty) p.difficulty = interviewFilter.difficulty; if (interviewFilter.topic) p.topic = interviewFilter.topic; const { data } = await getCoreSubjectInterviewQuestions(subjectSlug, p); setInterviewQs(data.data || []); } catch (e) { console.error(e); } };
  const handleMCQAnswer = async (qid, idx) => { if (mcqAnswers[qid] !== undefined) return; setMcqAnswers(p => ({ ...p, [qid]: idx })); try { const res = await submitCoreMCQAttempt(subjectSlug, qid, { selectedAnswer: idx, timeTaken: 30 }); setMcqSolutions(p => ({ ...p, [qid]: res.data.data })); } catch (e) { console.error(e); } };
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (!subject) return <div className={PAGE_CONTAINER}><p className="text-gray-400">Subject not found</p></div>;
  const tabs = [{ key: 'notes', label: 'Notes', icon: BookOpen, count: notes.length }, { key: 'mcqs', label: 'Probable MCQs', icon: HelpCircle, count: subject.mcqs }, { key: 'interview', label: 'Interview Qs', icon: MessageSquare, count: subject.interviewQuestions }];
  return (<div className={PAGE_CONTAINER}>
    <Link to="/interview-prep" className="text-blue-400 text-sm flex items-center gap-1 mb-4 hover:text-blue-300"><ArrowLeft className="w-4 h-4" /> All Subjects</Link>
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6"><h1 className="text-2xl font-bold text-white mb-1">{subject.name}</h1><p className="text-blue-100 text-sm">{subject.description}</p></div>
    <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">{tabs.map(tab => { const Icon = tab.icon; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Icon className="w-4 h-4" /> {tab.label} <span className="text-xs opacity-70">({tab.count})</span></button>); })}</div>
    {activeTab === 'mcqs' && (<div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={mcqFilter.difficulty} onChange={e => setMcqFilter(p => ({ ...p, difficulty: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"><option value="">All Difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select value={mcqFilter.topic} onChange={e => setMcqFilter(p => ({ ...p, topic: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"><option value="">All Topics</option>{subject.topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
      </div>
      <div className="space-y-4">{mcqs.map((mcq, idx) => {
        const sel = mcqAnswers[mcq._id]; const sol = mcqSolutions[mcq._id];
        return (<div key={mcq._id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3"><span className="text-gray-500 text-xs">Q{idx + 1}</span><span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[mcq.difficulty] || ''}`}>{mcq.difficulty}</span></div>
          <p className="text-white text-sm mb-4">{mcq.question}</p>
          <div className="space-y-2">{mcq.options.map((opt, oi) => {
            let cls = 'border-gray-700 hover:border-gray-500 text-gray-300';
            if (sel !== undefined) { if (oi === sol?.correctAnswer) cls = 'border-green-500 bg-green-900/20 text-green-300'; else if (oi === sel && !sol?.isCorrect) cls = 'border-red-500 bg-red-900/20 text-red-300'; }
            return (<button key={oi} onClick={() => handleMCQAnswer(mcq._id, oi)} disabled={sel !== undefined} className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${cls} ${sel !== undefined ? 'cursor-default' : 'cursor-pointer'}`}><span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}</button>);
          })}</div>
          {sol && (<div className={`mt-3 p-3 rounded-lg text-xs ${sol.isCorrect ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
            <div className="flex items-center gap-1 mb-1">{sol.isCorrect ? <CheckCircle className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />}<span className={sol.isCorrect ? 'text-green-400' : 'text-red-400'}>{sol.isCorrect ? 'Correct!' : 'Incorrect'}</span></div>
            <p className="text-gray-400">{sol.explanation}</p>
          </div>)}
        </div>);
      })}{mcqs.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No MCQs found.</p>}</div>
    </div>)}
    {activeTab === 'interview' && (<div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={interviewFilter.difficulty} onChange={e => setInterviewFilter(p => ({ ...p, difficulty: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"><option value="">All Difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select value={interviewFilter.topic} onChange={e => setInterviewFilter(p => ({ ...p, topic: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"><option value="">All Topics</option>{subject.topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
      </div>
      <div className="space-y-4">{interviewQs.map((iq, idx) => (
        <div key={iq._id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3"><span className="text-gray-500 text-xs">Q{idx + 1}</span><span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[iq.difficulty] || ''}`}>{iq.difficulty}</span></div>
          <div className="mb-3"><h4 className="text-blue-400 text-xs font-semibold mb-1">Question:</h4><p className="text-white text-sm">{iq.question}</p></div>
          <div className="mb-3"><h4 className="text-green-400 text-xs font-semibold mb-1">Answer:</h4><p className="text-gray-300 text-sm">{iq.answer}</p></div>
          {iq.explanation && <div className="mb-3"><h4 className="text-purple-400 text-xs font-semibold mb-1">Explanation:</h4><p className="text-gray-400 text-xs">{iq.explanation}</p></div>}
          {iq.followUps?.length > 0 && <div><h4 className="text-yellow-400 text-xs font-semibold mb-1">Follow-ups:</h4><ul className="list-disc list-inside text-gray-400 text-xs space-y-1">{iq.followUps.map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
        </div>
      ))}{interviewQs.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No interview questions found.</p>}</div>
    </div>)}

    {activeTab === 'notes' && (<div className="space-y-3">{subject.topics.map(topic => { const isExp = expandedNotes[topic._id] !== false; const note = notes.find(n => n.topic === topic._id); return (<div key={topic._id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"><button onClick={() => setExpandedNotes(p => ({ ...p, [topic._id]: !p[topic._id] }))} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50"><span className="text-white font-medium">{topic.name}</span>{isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</button>{isExp && (<div className="px-4 pb-4 border-t border-gray-800 pt-3">{note ? (<div><p className="text-gray-300 text-sm mb-3">{note.content}</p>{note.keyPoints?.length > 0 && <div className="mb-2"><h4 className="text-blue-400 text-xs font-semibold mb-1">Key Points:</h4><ul className="list-disc list-inside text-gray-400 text-xs space-y-1">{note.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul></div>}{note.interviewTips?.length > 0 && <div><h4 className="text-purple-400 text-xs font-semibold mb-1">Interview Tips:</h4><ul className="list-disc list-inside text-gray-400 text-xs space-y-1">{note.interviewTips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}</div>) : <p className="text-gray-500 text-sm">Notes coming soon.</p>}</div>)}</div>); })}</div>)}
  </div>);
}
