import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Award,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Textarea } from '../../../app/components/ui/textarea';
import { Badge } from '../../../app/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import { useAuth } from '../../../contexts/AuthContext';
import { submitRoleApplication, getMyRoleApplication } from '../api/adminApi';
import type { RoleApplicationItem } from '../types/admin.types';
import { toast } from 'sonner';

export function BecomeContributorPage() {
  const { user } = useAuth();
  const currentRole = user?.role || 'USER';

  const [application, setApplication] = useState<RoleApplicationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [motivation, setMotivation] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadApplication = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const app = await getMyRoleApplication();
      setApplication(app);
    } catch (err: any) {
      // If error or 404, no pending application
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, []);

  const handleAddLink = () => {
    if (links.length >= 3) {
      toast.error('Maximum 3 reference links allowed');
      return;
    }
    setLinks([...links, '']);
  };

  const handleLinkChange = (index: number, val: string) => {
    const updated = [...links];
    updated[index] = val;
    setLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivation.trim().length < 50) {
      toast.error('Motivation must be at least 50 characters long.');
      return;
    }
    if (qualifications.trim().length < 10) {
      toast.error('Please detail your botanical qualifications or experience.');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
      await submitRoleApplication({
        motivation: motivation.trim(),
        qualifications: qualifications.trim(),
        links: cleanLinks,
      });
      toast.success('Your application has been submitted for administrator review!');
      loadApplication();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentRole === 'BOTANIST' || currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-green-200 bg-green-50/50 text-center p-8">
          <Award className="w-12 h-12 text-green-700 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-green-950">You are already a Verified {currentRole}!</h2>
          <p className="text-sm text-green-800 mt-2 mb-6">
            You already have editorial and botanical contribution privileges on the platform.
          </p>
          <Button asChild className="bg-green-700 hover:bg-green-800 text-white">
            <a href="/dashboard/contributions">Go to Contribution Studio</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Become a Botanist</h1>
        <p className="text-slate-600 mt-1">
          Apply to contribute and publish verified medicinal plant monographs and traditional remedies
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading application status...</div>
      ) : application?.status === 'PENDING' ? (
        /* Pending Application Status Card */
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-600" />
              <div>
                <CardTitle className="text-lg font-bold text-amber-950">Application Under Review</CardTitle>
                <p className="text-xs text-amber-800 mt-0.5">
                  Submitted on {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge className="ml-auto bg-amber-200 text-amber-900 font-semibold text-xs">
                PENDING REVIEW
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>
              Thank you for applying to become a Botanist! An editorial administrator is reviewing your background and motivation.
              You will receive an in-app notification once a decision is made.
            </p>
            <div className="p-4 bg-white rounded-lg border border-amber-200/80 space-y-3">
              <div>
                <strong className="text-xs uppercase text-slate-500 block mb-1">Your Stated Motivation:</strong>
                <p className="text-xs text-slate-700 italic">"{application.motivation}"</p>
              </div>
              <div>
                <strong className="text-xs uppercase text-slate-500 block mb-1">Qualifications:</strong>
                <p className="text-xs text-slate-700">{application.qualifications}</p>
              </div>
              {application.links && application.links.length > 0 && (
                <div>
                  <strong className="text-xs uppercase text-slate-500 block mb-1">References:</strong>
                  <div className="flex flex-wrap gap-2">
                    {application.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-green-700 hover:underline flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                      >
                        {link} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Application Form (New or Resubmission after Rejection) */
        <div className="space-y-6">
          {application?.status === 'REJECTED' && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-semibold text-red-900">Previous Application Feedback</h4>
                  <p className="text-red-700 mt-1">{application.reviewNote || 'The application was not accepted at this time.'}</p>
                  <p className="text-xs text-red-600 mt-2">
                    You may review the feedback above and submit an updated application below.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-700" /> Contributor Application Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Motivation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Why do you want to become a Botanist contributor? <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs ${motivation.length < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                      {motivation.length} / 50 min characters
                    </span>
                  </div>
                  <Textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Describe your interest in medicinal flora, traditional herbal systems, or ethnobotany, and how you plan to contribute to our digital library..."
                    rows={4}
                    required
                  />
                </div>

                {/* Qualifications */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Your Botanical or Herbal Background & Experience <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="Share any degrees, certifications, fieldwork, gardening experience, or published work related to botany, herbalism, or pharmacology..."
                    rows={3}
                    required
                  />
                </div>

                {/* Reference Links */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Portfolio, Academic, or Professional Links (Max 3)
                    </label>
                    {links.length < 3 && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleAddLink} className="text-xs text-green-700">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          type="url"
                          value={link}
                          onChange={(e) => handleLinkChange(idx, e.target.value)}
                          placeholder="https://example.com/profile-or-paper"
                          className="text-sm"
                        />
                        {links.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLink(idx)}
                            className="text-slate-400 hover:text-red-600 px-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || motivation.trim().length < 50}
                    className="bg-green-700 hover:bg-green-800 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
