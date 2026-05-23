// SalesSphere AI – AI Assistant Consultation Room
import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { aiApi } from '@/services/api'
import LoadingScreen from '@/components/ui/LoadingScreen'
import toast from 'react-hot-toast'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AIInsight {
  id: number
  title: string
  description: string
  type: 'positive' | 'warning' | 'neutral'
  priority: 'high' | 'medium' | 'low'
}

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am your SalesSphere AI advisor, integrated with xAI Grok. Ask me anything about your revenue forecasts, top performers, inventory levels, or region sales.' }
  ])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [modelType, setModelType] = useState('xAI Grok')

  // Insights State
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true)
      const res = await aiApi.getInsights()
      setInsights(res.data.insights || [])
    } catch {
      toast.error('Failed to query automated business insights.')
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'insights') {
      fetchInsights()
    }
  }, [activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return
    setChatLoading(true)
    setInput('')

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)

    try {
      const res = await aiApi.chat(text, history)
      setMessages([...nextMessages, { role: 'assistant', content: res.data.response }])
      setModelType(res.data.model)
    } catch {
      toast.error('Failed to communicate with AI model.')
    } finally {
      setChatLoading(false)
    }
  }

  const handleChipClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const suggestions = [
    'Predict next month revenue forecast',
    'Which products need restocking immediately?',
    'What was the highest sales month and why?',
    'Analyze category sales performance overview'
  ]

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col page-enter">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            Grok AI Consult Room
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
            Interrogate your storefront invoices, audit inventory, or review automated growth ideas.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex gap-1 p-1 bg-slate-500/5 rounded-xl border border-slate-500/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'chat' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Consult Room
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'insights' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Insights Engine
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Chat Window */}
          <div className="flex-1 card flex flex-col min-h-0">
            {/* Model Badge */}
            <div className="px-6 py-3.5 border-b flex justify-between items-center text-xs">
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'rgb(var(--text-primary))' }}>
                <Bot size={15} className="text-indigo-400" /> Conversational Agent
              </span>
              <span className="badge badge-primary font-bold text-[10px] uppercase">
                {modelType}
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} />
                    </div>
                  )}
                  <div
                    className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="chat-bubble-ai flex items-center gap-1 py-4">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips & Input Form */}
            <div className="p-4 border-t space-y-4 bg-slate-500/5">
              {/* Chip helpers */}
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(s)}
                    disabled={chatLoading}
                    className="text-[11px] py-1 px-3 rounded-full border border-slate-500/15 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-slate-400 hover:text-slate-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(input)
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask Grok AI about your monthly sales performance..."
                  className="input flex-1 py-2.5 text-xs"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input.trim()}
                  className="btn-primary py-2 px-4 flex items-center justify-center"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>

          {/* Quick AI tips card */}
          <div className="w-full lg:w-80 card p-5 space-y-4 h-fit">
            <h4 className="text-sm font-black flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <Lightbulb size={16} className="text-amber-400" /> Prompts Guide
            </h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
              Maximize analytical yields by asking details such as:
            </p>
            <ul className="space-y-3.5 text-xs" style={{ color: 'rgb(var(--text-primary))' }}>
              <li className="flex gap-2.5">
                <HelpCircle size={15} className="text-indigo-400 flex-shrink-0" />
                <span>"Why did revenue dip by 18% in November?"</span>
              </li>
              <li className="flex gap-2.5">
                <HelpCircle size={15} className="text-indigo-400 flex-shrink-0" />
                <span>"Show a markdown table ranking top products"</span>
              </li>
              <li className="flex gap-2.5">
                <HelpCircle size={15} className="text-indigo-400 flex-shrink-0" />
                <span>"Forecast revenue trajectories for Q3"</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          {insightsLoading ? (
            <LoadingScreen />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((ins) => (
                <div key={ins.id} className="card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`badge ${
                        ins.type === 'positive' ? 'badge-success' :
                        ins.type === 'warning' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {ins.type === 'positive' && <CheckCircle size={12} />}
                        {ins.type === 'warning' && <AlertTriangle size={12} />}
                        {ins.type === 'neutral' && <AlertCircle size={12} />}
                        {ins.type}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ins.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                        ins.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {ins.priority} Priority
                      </span>
                    </div>

                    <h4 className="text-base font-black" style={{ color: 'rgb(var(--text-primary))' }}>
                      {ins.title}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
                      {ins.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('chat')
                      handleSendMessage(`Analyze more details regarding: ${ins.title}`)
                    }}
                    className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={12} /> Drill Insight
                  </button>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No insights returned. Complete some customer orders first!
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
