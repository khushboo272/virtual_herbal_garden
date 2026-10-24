import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  Sparkles,
  Leaf,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../app/components/ui/card';
import { Button } from '../../../../app/components/ui/button';
import { Input } from '../../../../app/components/ui/input';
import { Label } from '../../../../app/components/ui/label';
import { Textarea } from '../../../../app/components/ui/textarea';
import { Badge } from '../../../../app/components/ui/badge';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle';
import {
  submitSupportRequest,
  getMySupportRequests,
} from '../api/sharedDashboardApi';
import type { ISupportRequest } from '../types';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'contributor';
}

const FAQS: FAQItem[] = [
  {
    category: 'general',
    question: 'How do I add plants to My Garden?',
    answer:
      'When viewing any plant detail page in the Botanical Library, click the "Add to My Garden" button. Your added plant will appear in your 2D garden list as well as in the 3D interactive herbal garden space.',
  },
  {
    category: 'general',
    question: 'How do 3D garden navigation and controls work?',
    answer:
      'In the 3D Virtual Garden, use your mouse to click and drag to orbit around plants. Scroll your mouse wheel to zoom in and out. Click on any botanical marker to display detailed taxonomic information and medicinal qualities.',
  },
  {
    category: 'general',
    question: 'How does the AI Plant Scanner work?',
    answer:
      'Upload or capture a clear photo of an herbal plant (leaves, stems, or flowers). Our computer vision model identifies the botanical species and matches it against our pharmacological database. Botanists regularly verify scans in the AI Feedback Queue to improve accuracy.',
  },
  {
    category: 'contributor',
    question: 'How does the botanist contribution and review workflow work?',
    answer:
      'Botanists can create plant or remedy drafts at any time. When all completeness checklist items are fulfilled (description, taxonomy, parts used, at least 1 citation/reference), you can submit your draft for review. Platform administrators inspect your submission and will either approve it for immediate publishing, reject it, or request changes with detailed notes.',
  },
  {
    category: 'contributor',
    question: 'What do the submission statuses mean?',
    answer:
      '• DRAFT: Editable only by you; not visible to the public.\n• IN_REVIEW: Submitted to platform administrators for validation. Content is locked from editing.\n• CHANGES_REQUESTED: The reviewer suggested improvements. Review notes are provided and the draft is unlocked for revisions.\n• APPROVED / PUBLISHED: The entry meets editorial criteria and is live in the public library and search.\n• REJECTED: The submission does not meet scientific or safety standards.',
  },
  {
    category: 'contributor',
    question: 'What are the medicinal claim safety rules?',
    answer:
      'To prevent dangerous misinformation, all text is checked for prohibited absolute claims. Submissions containing terms like "cures", "guaranteed", "miracle", "100% effective", or "no side effects" cannot be submitted for review. Please use evidence-based phrasing such as "traditionally used for", "preliminary studies suggest", or "may assist with".',
  },
  {
    category: 'contributor',
    question: 'What are the specifications for plant photos and 3D models?',
    answer:
      'Photos should be high-resolution (min 800x600, max 10MB) in JPG, PNG, or WebP format with good lighting. 3D models must be exported as standard binary GLTF (.glb format, under 25MB) with embedded textures and centered pivots.',
  },
  {
    category: 'contributor',
    question: 'Why is at least 1 citation/reference required?',
    answer:
      'Virtual Herbal Garden requires academic and pharmacological rigor. Every plant and remedy submission must cite at least one recognized scientific journal, pharmacopoeia (e.g., Ayurvedic Pharmacopoeia of India, WHO Monographs), or ethnobotanical publication.',
  },
];

export function HelpSupportPage() {
  useDocumentTitle('Help & Support | Virtual Herbal Garden');
  const { user } = useAuth();
  const isBotanistOrAbove =
    user?.role === 'BOTANIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // FAQ accordion open states
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0, 3]);

  // Support form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tickets list
  const [tickets, setTickets] = useState<ISupportRequest[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    setLoadingTickets(true);
    getMySupportRequests()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoadingTickets(false));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSubmitting(true);
      const req = await submitSupportRequest(subject.trim(), message.trim());
      toast.success('Support request sent! Our botanical support team will respond shortly.');
      setSubject('');
      setMessage('');
      setTickets((prev) => [req, ...prev]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit support request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-green-700" />
          Help & Support
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore frequently asked questions, contribution guidelines, or contact platform support.
        </p>
      </div>

      {/* Contributor Guidelines Banner (if botanist) */}
      {isBotanistOrAbove && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white border border-purple-200 shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-purple-900">Botanist Editorial Standards</h4>
              <Badge className="bg-purple-200 text-purple-800 text-[10px]">Active Contributor</Badge>
            </div>
            <p className="text-xs text-purple-700 mt-1 leading-relaxed">
              As an authorized botanist, your submissions enrich our shared open botanical database.
              Ensure all plant and remedy submissions maintain strict pharmacological neutrality, include
              authoritative citations, and avoid unsubstantiated claims.
            </p>
          </div>
        </div>
      )}

      {/* FAQ Accordion Section */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndices.includes(index);
            const isContributorFaq = faq.category === 'contributor';

            return (
              <div key={index} className="p-4 transition-colors hover:bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-2">
                    {isContributorFaq ? (
                      <Badge className="bg-purple-100 text-purple-700 text-[10px] shrink-0 border-purple-200">
                        Contributor
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] shrink-0 border-emerald-200">
                        General
                      </Badge>
                    )}
                    <span className="text-sm font-medium text-gray-900 group-hover:text-green-800 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="mt-3 text-xs text-gray-600 pl-16 pr-4 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Contact Support Form */}
      <Card className="border border-green-200/60 shadow-xs bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              Contact Platform Support
            </CardTitle>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" /> Rate limit: 3/hr
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="support-subject" className="text-xs font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Question regarding botanical taxonomy review or 3D asset upload"
                className="border-green-200 focus:border-green-400 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="support-message" className="text-xs font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="support-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your question, issue, or feedback in detail..."
                className="border-green-200 focus:border-green-400 text-sm"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Previous Support Requests */}
      {tickets.length > 0 && (
        <Card className="border border-slate-200 shadow-xs bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-900">
              Your Support History ({tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {tickets.map((t) => (
              <div key={t._id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div>
                  <h5 className="font-semibold text-gray-900">{t.subject}</h5>
                  <p className="text-gray-500 mt-1 line-clamp-2">{t.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Submitted {new Date(t.createdAt).toLocaleString()}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    t.status === 'OPEN'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }
                >
                  {t.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
