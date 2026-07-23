import { useState, useEffect } from 'react';
import { getTopicProgress, getTopicDetails } from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PAGE_CONTAINER, LOADING_SPINNER, EMPTY_STATE_CLASSES } from '../utils/ui';
import { BookOpen, Target, ChevronDown, ChevronRight, Code2, Database, Loader2 } from 'lucide-react';

function TopicCard({ topic, selectedTopic, topicDetail, showNote, onToggle, onToggleNote }) {
  const accuracyColor = (acc) => {
    if (acc >= 80) return 'text-green-400';
    if (acc >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">{topic.topic}</h3>
        <span className={`text-sm font-bold ${accuracyColor(topic.accuracy)}`}>{topic.accuracy}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${topic.accuracy}%` }}></div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>{topic.accepted}/{topic.totalProblems} solved</span>
        {topic.hasNote && <span className="text-blue-400">Has Notes</span>}
      </div>
      <button onClick={() => onToggle(topic.topic)} className="w-full text-left text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
        {selectedTopic === topic.topic ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        View Problems & Notes
      </button>
      {selectedTopic === topic.topic && topicDetail && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          {topicDetail.note && (
            <div className="mb-3">
              <button onClick={onToggleNote} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mb-2">
                <Code2 className="w-3 h-3" /> Concept Notes {showNote[topic.topic] ? '▼' : '▶'}
              </button>
              {showNote[topic.topic] && (
                <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-2 mb-2">
                  <p className="mb-1">{topicDetail.note.summary}</p>
                  {topicDetail.note.commonMistakes?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-400 mb-1">Common Mistakes:</p>
                      <ul className="list-disc list-inside">{topicDetail.note.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="space-y-1">
            {topicDetail.problems?.slice(0, 5).map((p) => (
              <Link key={p._id} to={`/problems/${p.slug}`} className="block text-xs text-gray-300 hover:text-white truncate">
                {p.title}
              </Link>
            ))}
            {topicDetail.problems?.length > 5 && (
              <Link to={`/problems?tag=${encodeURIComponent(topic.topic)}`} className="text-xs text-blue-400 hover:text-blue-300">
                View all {topicDetail.problems.length} problems →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topics() {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [dsaTopics, setDsaTopics] = useState([]);
  const [sqlTopics, setSqlTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicDetail, setTopicDetail] = useState(null);
  const [showNote, setShowNote] = useState({});

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { data } = await getTopicProgress();
      const topicsData = data.data.topics || [];
      setTopics(topicsData);
      setDsaTopics(data.data.dsaTopics || []);
      setSqlTopics(data.data.sqlTopics || []);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopicDetail = async (topic) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null);
      setTopicDetail(null);
      return;
    }
    setSelectedTopic(topic);
    setTopicDetail(null);
    try {
      const { data } = await getTopicDetails(topic);
      setTopicDetail(data.data);
    } catch (error) {
      console.error('Failed to load topic detail:', error);
    }
  };

  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8" /> Topic-wise Progress
        </h1>
        <p className="text-blue-100">Track your strengths and weaknesses across all topics</p>
      </div>

      {topics.length === 0 ? (
        <div className={EMPTY_STATE_CLASSES}>
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
          <p className="text-gray-500">No topic data yet. Start solving problems!</p>
        </div>
      ) : (
        <>
          {/* DSA Progress Section */}
          {dsaTopics.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" /> DSA Progress
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dsaTopics.map((topic) => (
                  <TopicCard key={topic.topic} topic={topic} selectedTopic={selectedTopic} topicDetail={topicDetail}
                    showNote={showNote} onToggle={loadTopicDetail} onToggleNote={() => setShowNote({ ...showNote, [topic.topic]: !showNote[topic.topic] })} />
                ))}
              </div>
            </div>
          )}

          {/* SQL Progress Section */}
          {sqlTopics.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-400" /> SQL Progress
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sqlTopics.map((topic) => (
                  <TopicCard key={topic.topic} topic={topic} selectedTopic={selectedTopic} topicDetail={topicDetail}
                    showNote={showNote} onToggle={loadTopicDetail} onToggleNote={() => setShowNote({ ...showNote, [topic.topic]: !showNote[topic.topic] })} />
                ))}
              </div>
            </div>
          )}

          {dsaTopics.length === 0 && sqlTopics.length === 0 && (
            <div className={EMPTY_STATE_CLASSES}>
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
              <p className="text-gray-500">No topic data yet. Start solving problems!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}