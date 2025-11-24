import React from 'react';
import { NoteData } from '../types';
import { Calendar, CheckCircle2, FileText, Share2, MoreHorizontal, MessageSquare } from 'lucide-react';

interface NoteViewProps {
  data: NoteData;
  createdAt: Date;
  onToggleActionItem: (id: string) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({ data, createdAt, onToggleActionItem }) => {
  // Calculate stats
  const completedCount = data.actionItems.filter(i => i.completed).length;
  const totalCount = data.actionItems.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{data.title}</h1>
          <div className="flex items-center space-x-4 text-slate-500 text-sm">
            <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
              <Calendar className="w-4 h-4 mr-2" />
              {createdAt.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center bg-slate-100 px-2 py-1 rounded">
              <MessageSquare className="w-4 h-4 mr-2" />
              Transcribed by Gemini
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Section */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
             <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
               <FileText className="w-5 h-5 mr-2 text-indigo-500" /> Executive Summary
             </h3>
             <p className="text-slate-600 leading-relaxed text-base">
               {data.summary}
             </p>
          </section>

          {/* Action Items */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> Action Items
              </h3>
              <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                {completedCount}/{totalCount} Completed
              </span>
            </div>
            
            <ul className="space-y-3">
              {data.actionItems.map((item) => (
                <li key={item.id} className={`flex items-start group p-3 rounded-lg transition-all ${item.completed ? 'bg-slate-50' : 'hover:bg-indigo-50/30'}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={item.completed}
                      onChange={() => onToggleActionItem(item.id)}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer transition-colors" 
                    />
                  </div>
                  <span 
                    className={`ml-3 text-base transition-all cursor-pointer select-none flex-1 ${
                      item.completed ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-slate-900'
                    }`}
                    onClick={() => onToggleActionItem(item.id)}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar / Stats or Details */}
        <div className="space-y-6">
           {/* Progress Widget */}
           <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Task Progress</h3>
             <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
               <div 
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
               ></div>
             </div>
             <p className="text-xs text-slate-500 text-right">{progress}% Complete</p>
           </div>

          <section className="bg-slate-50 rounded-xl p-6 border border-slate-200 h-[400px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex-shrink-0">Transcription</h3>
            <div className="prose prose-sm prose-slate max-w-none text-slate-600 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {data.transcription.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};