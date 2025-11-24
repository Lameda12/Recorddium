import React, { useState } from 'react';
import { Recording } from '../types';
import { Search, Clock, Plus, ChevronRight, CheckSquare, MessageSquare } from 'lucide-react';
import { formatDuration } from '../utils/audioUtils';

interface SidebarProps {
  recordings: Recording[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  onNew: () => void;
}

type Tab = 'notes' | 'tasks';

export const Sidebar: React.FC<SidebarProps> = ({ recordings, onSelect, selectedId, onNew }) => {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived state for tasks
  const allIncompleteTasks = recordings.flatMap(rec => {
    if (!rec.data) return [];
    return rec.data.actionItems
      .filter(item => !item.completed)
      .map(item => ({
        ...item,
        recordingId: rec.id,
        recordingTitle: rec.data!.title,
        createdAt: rec.createdAt
      }));
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const filteredRecordings = recordings.filter(rec => 
    rec.data?.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    rec.data?.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = allIncompleteTasks.filter(task => 
    task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.recordingTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full flex flex-col bg-slate-50 border-r border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">R</span>
          </div>
          <h1 className="text-lg font-bold text-slate-800">Recordium</h1>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'notes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Notes</span>
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="relative">
              <CheckSquare className="w-4 h-4" />
              {allIncompleteTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <span>Tasks</span>
          </button>
        </div>

        <button 
          onClick={onNew}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Recording</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'notes' ? "Search conversations..." : "Search tasks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pb-3 space-y-2">
          {activeTab === 'notes' ? (
            <>
              {filteredRecordings.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {searchQuery ? "No matching notes found" : "No recordings yet"}
                </div>
              )}
              {filteredRecordings.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => onSelect(rec.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                    selectedId === rec.id 
                      ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500' 
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium text-sm truncate pr-2 ${selectedId === rec.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {rec.data?.title || 'Processing...'}
                    </span>
                    {selectedId === rec.id && <ChevronRight className="w-4 h-4 text-indigo-500" />}
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center">
                       {new Date(rec.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(rec.duration)}
                    </span>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <>
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {searchQuery ? "No matching tasks" : "No pending tasks"}
                </div>
              )}
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelect(task.recordingId)}
                  className="w-full text-left p-3 rounded-lg bg-white border border-transparent hover:border-slate-200 hover:bg-slate-50/50 transition-all group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 w-4 h-4 rounded border border-indigo-300 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2 leading-snug group-hover:text-slate-900">{task.text}</p>
                      <p className="text-xs text-indigo-500 mt-1.5 truncate">
                        From: {task.recordingTitle}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-500 shadow-sm"></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Alex Sales</p>
            <p className="text-xs text-slate-500 truncate">Premium Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};