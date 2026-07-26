import { useState, useEffect } from 'react';
import { getInterviewExperiences, createInterviewExperience, voteInterviewExperience, getMyInterviewExperiences, deleteInterviewExperience } from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ThumbsUp, ThumbsDown, Plus, Loader2, Building2, Calendar, ChevronDown, ChevronUp, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAGE_CONTAINER, LOADING_SPINNER, EMPTY_STATE_CLASSES, BUTTON_CLASSES, INPUT_CLASSES, SELECT_CLASSES } from '../utils/ui';

export default function InterviewExperiences() {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [myExperiences, setMyExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState('browse');
  const [form, setForm] = useState({
    company: '',
    role: '',
    year: new Date().getFullYear().toString(),
    roundType: 'Technical Round 1',
    difficulty: 'Medium',
    experience: '',
    tips: '',
    offerReceived: false,
    packageOffered: '',
    questions: [{ question: '', answer: '', topic: '' }],
  });

  useEffect(() => {
    if (tab === 'browse') loadExperiences();
    else loadMyExperiences();
  }, [tab, page, filter]);

  const loadExperiences = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter) params.company = filter;
      const { data } = await getInterviewExperiences(params);
      setExperiences(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyExperiences = async () => {
    setLoading(true);
    try {
      const { data } = await getMyInterviewExperiences();
      setMyExperiences(data.data || []);
    } catch (error) {
      console.error('Failed to load my experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, voteType) => {
    try {
      await voteInterviewExperience(id, voteType);
      loadExperiences();
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const filteredQuestions = form.questions.filter(q => q.question.trim());
      await createInterviewExperience({
        ...form,
        questions: filteredQuestions,
      });
      toast.success('Experience shared successfully!');
      setShowCreate(false);
      setForm({
        company: '', role: '', year: new Date().getFullYear().toString(),
        roundType: 'Technical Round 1', difficulty: 'Medium',
        experience: '', tips: '', offerReceived: false, packageOffered: '',
        questions: [{ question: '', answer: '', topic: '' }],
      });
      loadExperiences();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share experience');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this experience?')) return;
    try {
      await deleteInterviewExperience(id);
      toast.success('Deleted');
      loadMyExperiences();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const addQuestion = () => {
    setForm({ ...form, questions: [...form.questions, { question: '', answer: '', topic: '' }] });
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...form.questions];
    questions[index][field] = value;
    setForm({ ...form, questions });
  };

  const removeQuestion = (index) => {
    const questions = form.questions.filter((_, i) => i !== index);
    setForm({ ...form, questions });
  };

  const getDifficultyColor = (d) => {
    const colors = { Easy: 'text-green-400 bg-green-900/30', Medium: 'text-yellow-400 bg-yellow-900/30', Hard: 'text-red-400 bg-red-900/30', 'Very Hard': 'text-purple-400 bg-purple-900/30' };
    return colors[d] || colors.Medium;
  };

  if (loading && experiences.length === 0 && myExperiences.length === 0) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8" /> Interview Experiences
        </h1>
        <p className="text-green-100">Learn from peers who've been through campus placements</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={() => setTab('browse')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'browse' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Browse Experiences
          </button>
          <button onClick={() => setTab('my')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'my' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            My Experiences
          </button>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Share Experience
        </button>
      </div>

      {tab === 'browse' && (
        <>
          {/* Filter */}
          <div className="mb-4">
            <input
              type="text"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              placeholder="Filter by company name..."
              className={INPUT_CLASSES + ' max-w-xs'}
            />
          </div>

          {/* Experiences List */}
          {experiences.length === 0 ? (
            <div className={EMPTY_STATE_CLASSES}>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
              <p className="text-gray-500">No interview experiences yet. Be the first to share!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp) => {
                const isExpanded = expandedId === exp._id;
                const upvoteCount = exp.upvotes?.length || 0;
                const downvoteCount = exp.downvotes?.length || 0;
                return (
                  <div key={exp._id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <h3 className="text-white font-semibold">{exp.company}</h3>
                            <span className="text-gray-500 text-sm">- {exp.role}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {exp.year}</span>
                            <span>{exp.roundType}</span>
                            <span className={`px-2 py-0.5 rounded-full ${getDifficultyColor(exp.difficulty)}`}>{exp.difficulty}</span>
                            {exp.offerReceived && <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> Offer Received{exp.packageOffered ? ` (${exp.packageOffered})` : ''}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleVote(exp._id, 'upvote')} className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors text-sm">
                            <ThumbsUp className="w-3.5 h-3.5" /> {upvoteCount}
                          </button>
                          <button onClick={() => handleVote(exp._id, 'downvote')} className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors text-sm">
                            <ThumbsDown className="w-3.5 h-3.5" /> {downvoteCount}
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3 line-clamp-3">{exp.experience}</p>

                      {exp.questions?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Questions asked ({exp.questions.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {exp.questions.slice(0, 3).map((q, i) => (
                              <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded truncate max-w-[200px]">{q.question}</span>
                            ))}
                            {exp.questions.length > 3 && <span className="text-xs text-blue-400">+{exp.questions.length - 3} more</span>}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>by {exp.user?.name || 'Anonymous'}</span>
                          {exp.user?.profile?.college && <span>• {exp.user.profile.college}</span>}
                        </div>
                        <button onClick={() => setExpandedId(isExpanded ? null : exp._id)} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'Show Less' : 'Read More'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-800 p-5 bg-gray-800/30">
                        <div className="text-gray-300 text-sm whitespace-pre-wrap mb-4">{exp.experience}</div>
                        
                        {exp.tips && (
                          <div className="mb-4">
                            <h4 className="text-yellow-400 font-medium text-sm mb-2">Tips</h4>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{exp.tips}</p>
                          </div>
                        )}

                        {exp.questions?.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium text-sm mb-2">Questions & Answers</h4>
                            <div className="space-y-2">
                              {exp.questions.map((q, i) => (
                                <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                                  <p className="text-gray-200 text-sm font-medium mb-1">Q{i + 1}: {q.question}</p>
                                  {q.answer && <p className="text-gray-400 text-xs">A: {q.answer}</p>}
                                  {q.topic && <span className="text-xs text-blue-400 mt-1 inline-block">{q.topic}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm">Previous</button>
              <span className="px-4 py-2 text-gray-400 text-sm">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm">Next</button>
            </div>
          )}
        </>
      )}

      {tab === 'my' && (
        <div className="space-y-3">
          {myExperiences.length === 0 ? (
            <div className={EMPTY_STATE_CLASSES}>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
              <p className="text-gray-500">You haven't shared any experiences yet.</p>
            </div>
          ) : (
            myExperiences.map((exp) => (
              <div key={exp._id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{exp.company}</span>
                      <span className="text-gray-500 text-sm">- {exp.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(exp.difficulty)}`}>{exp.difficulty}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{exp.roundType} • {exp.year} • {exp.upvotes?.length || 0} upvotes</p>
                  </div>
                  <button onClick={() => handleDelete(exp._id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Share Interview Experience</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Company *</label>
                  <input type="text" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={INPUT_CLASSES} placeholder="e.g. Google" />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Role *</label>
                  <input type="text" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={INPUT_CLASSES} placeholder="e.g. SDE-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Year</label>
                  <input type="text" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={INPUT_CLASSES} />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Round Type</label>
                  <select value={form.roundType} onChange={(e) => setForm({ ...form, roundType: e.target.value })} className={SELECT_CLASSES + ' w-full'}>
                    <option>Online Assessment</option>
                    <option>Technical Round 1</option>
                    <option>Technical Round 2</option>
                    <option>HR Round</option>
                    <option>Managerial Round</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={SELECT_CLASSES + ' w-full'}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                    <option>Very Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm block mb-1">Your Experience *</label>
                <textarea required value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className={INPUT_CLASSES + ' h-32'} placeholder="Describe your interview experience in detail..." />
              </div>
              <div>
                <label className="text-gray-300 text-sm block mb-1">Tips for Others</label>
                <textarea value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })} className={INPUT_CLASSES + ' h-20'} placeholder="Any tips or advice..." />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300 text-sm">
                  <input type="checkbox" checked={form.offerReceived} onChange={(e) => setForm({ ...form, offerReceived: e.target.checked })} className="rounded" />
                  Received Offer
                </label>
                {form.offerReceived && (
                  <input type="text" value={form.packageOffered} onChange={(e) => setForm({ ...form, packageOffered: e.target.value })} className={INPUT_CLASSES + ' flex-1'} placeholder="Package (e.g. 24 LPA)" />
                )}
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm">Questions Asked</label>
                  <button type="button" onClick={addQuestion} className="text-blue-400 hover:text-blue-300 text-sm">+ Add Question</button>
                </div>
                {form.questions.map((q, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Question {i + 1}</span>
                      {form.questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                      )}
                    </div>
                    <input type="text" value={q.question} onChange={(e) => updateQuestion(i, 'question', e.target.value)} className={INPUT_CLASSES + ' mb-2'} placeholder="Question asked" />
                    <input type="text" value={q.answer} onChange={(e) => updateQuestion(i, 'answer', e.target.value)} className={INPUT_CLASSES + ' mb-2'} placeholder="Your answer (optional)" />
                    <input type="text" value={q.topic} onChange={(e) => updateQuestion(i, 'topic', e.target.value)} className={INPUT_CLASSES} placeholder="Topic (e.g. Arrays, DBMS)" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Share Experience</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}