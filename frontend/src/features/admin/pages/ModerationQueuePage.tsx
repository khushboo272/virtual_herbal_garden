import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Leaf,
  FileText,
  Users,
  Search,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Badge } from '../../../app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../app/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import { Textarea } from '../../../app/components/ui/textarea';
import {
  getModerationSummary,
  getModerationQueue,
  getRoleApplications,
  approveRoleApplication,
  rejectRoleApplication,
} from '../api/adminApi';
import type {
  ModerationSummary,
  ModerationQueueItem,
  RoleApplicationItem,
} from '../types/admin.types';
import { toast } from 'sonner';

export const MODERATION_TABS = [
  { key: 'plant', label: 'Plants', icon: Leaf },
  { key: 'remedy', label: 'Remedies', icon: FileText },
  { key: 'application', label: 'Role Applications', icon: Users },
];

export function ModerationQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get('type') || 'plant';
  const searchQuery = searchParams.get('q') || '';

  const [summary, setSummary] = useState<ModerationSummary | null>(null);
  const [items, setItems] = useState<ModerationQueueItem[]>([]);
  const [applications, setApplications] = useState<RoleApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected application for quick review dialog
  const [selectedApp, setSelectedApp] = useState<RoleApplicationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load summary counts
  const loadSummary = async () => {
    try {
      const sum = await getModerationSummary();
      setSummary(sum);
    } catch {
      // ignore non-critical summary fail
    }
  };

  // Load tab content
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (currentTab === 'application') {
        const res = await getRoleApplications({ status: 'PENDING' });
        setApplications(res.items);
      } else {
        const res = await getModerationQueue({
          type: currentTab as 'plant' | 'remedy',
          status: 'PENDING_REVIEW',
          q: searchQuery,
        });
        setItems(res.items);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load moderation items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadData();
  }, [currentTab, searchQuery]);

  const handleTabChange = (val: string) => {
    setSearchParams({ type: val });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('search') as HTMLInputElement;
    setSearchParams({ type: currentTab, q: input.value.trim() });
  };

  const handleApproveApp = async (app: RoleApplicationItem) => {
    // Optimistically remove card immediately so UI reflects change without delay
    setApplications((prev) => prev.filter((a) => a._id !== app._id));
    setSelectedApp(null);
    try {
      setIsProcessing(true);
      await approveRoleApplication(app._id);
      toast.success(`Application approved! ${app.userId?.displayName || 'User'} is now a Botanist.`, {
        duration: 3500,
      });
      loadSummary();
      loadData();
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('already approved') || msg.toLowerCase().includes('already')) {
        toast.info('Application was already approved and has been cleared from queue.', {
          duration: 3500,
        });
        loadSummary();
        loadData();
      } else {
        toast.error(msg || 'Failed to approve application.', { duration: 4000 });
        loadData();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApp = async () => {
    if (!selectedApp || !rejectReason.trim()) {
      toast.error('Please enter a feedback reason for rejection.', { duration: 3500 });
      return;
    }
    const appId = selectedApp._id;
    // Optimistically remove card and close dialog immediately
    setApplications((prev) => prev.filter((a) => a._id !== appId));
    setIsRejectDialogOpen(false);
    setSelectedApp(null);

    try {
      setIsProcessing(true);
      await rejectRoleApplication(appId, rejectReason.trim());
      toast.success('Application rejected and user notified.', { duration: 3500 });
      setRejectReason('');
      loadSummary();
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject application.', { duration: 4000 });
      loadData();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Moderation Queue</h1>
          <p className="text-slate-600 mt-1">Review botanist submissions and contributor role applications</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadSummary(); loadData(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Config-driven Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-3">
          <TabsList className="bg-slate-100 p-1">
            {MODERATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const count =
                tab.key === 'plant'
                  ? summary?.plants
                  : tab.key === 'remedy'
                  ? summary?.remedies
                  : summary?.applications;

              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="data-[state=active]:bg-white data-[state=active]:text-green-800 data-[state=active]:shadow-sm px-4 py-2"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {typeof count === 'number' && count > 0 && (
                    <Badge className="ml-2 bg-amber-500 hover:bg-amber-600 text-white text-xs px-1.5 py-0">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Search Box */}
          {currentTab !== 'application' && (
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                name="search"
                defaultValue={searchQuery}
                placeholder={`Search ${currentTab}s...`}
                className="pl-9 pr-4 py-2 bg-white"
              />
            </form>
          )}
        </div>

        {/* Content Tabs (Plants & Remedies) */}
        {(currentTab === 'plant' || currentTab === 'remedy') && (
          <TabsContent value={currentTab} className="mt-0">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-500 animate-pulse">Loading moderation queue...</div>
                ) : error ? (
                  <div className="py-14 px-4 text-center space-y-4">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                    <div>
                      <h3 className="font-semibold text-slate-800 text-base">Failed to load {currentTab}s</h3>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { loadSummary(); loadData(); }}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 space-y-2">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                    <h3 className="font-semibold text-slate-800 text-base">All clear!</h3>
                    <p className="text-sm text-slate-500">No pending {currentTab}s awaiting editorial review.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Item</TableHead>
                        <TableHead>Contributor</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Completeness</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id} className={item.isOverdue ? 'bg-amber-50/40' : undefined}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-slate-900 font-semibold">{item.title}</span>
                              {item.subtitle && <span className="text-xs text-slate-500 italic">{item.subtitle}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium text-slate-800">{item.owner.displayName}</p>
                              <p className="text-xs text-slate-400">{item.owner.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.daysAgo === 0 ? 'Today' : `${item.daysAgo}d ago`}</span>
                              {item.isOverdue && (
                                <Badge variant="destructive" className="text-xs uppercase font-bold">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {currentTab === 'plant' && (
                                <>
                                  <Badge variant={item.flags.hasHeroImage ? 'outline' : 'secondary'} className="text-[10px]">
                                    {item.flags.hasHeroImage ? '✓ Photo' : '✗ Photo'}
                                  </Badge>
                                  <Badge variant={item.flags.hasMedicinalUses ? 'outline' : 'secondary'} className="text-[10px]">
                                    {item.flags.hasMedicinalUses ? '✓ Uses' : '✗ Uses'}
                                  </Badge>
                                  <Badge variant={item.flags.hasReferences ? 'outline' : 'secondary'} className="text-[10px]">
                                    {item.flags.hasReferences ? '✓ Sources' : '✗ Sources'}
                                  </Badge>
                                </>
                              )}
                              {currentTab === 'remedy' && (
                                <>
                                  <Badge variant={item.flags.hasIngredients ? 'outline' : 'secondary'} className="text-[10px]">
                                    {item.flags.hasIngredients ? '✓ Ingredients' : '✗ Ingredients'}
                                  </Badge>
                                  <Badge variant={item.flags.hasPreparationSteps ? 'outline' : 'secondary'} className="text-[10px]">
                                    {item.flags.hasPreparationSteps ? '✓ Steps' : '✗ Steps'}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => navigate(`/dashboard/moderation/${currentTab}/${item.id}`)}
                              className="bg-green-700 hover:bg-green-800 text-white text-xs"
                              size="sm"
                            >
                              Review <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Role Applications Tab */}
        {currentTab === 'application' && (
          <TabsContent value="application" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading contributor applications...</div>
            ) : error ? (
              <Card>
                <CardContent className="py-14 px-4 text-center space-y-4">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">Failed to load contributor applications</h3>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { loadSummary(); loadData(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-slate-500 space-y-2">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                  <h3 className="font-semibold text-slate-800 text-base">No pending applications</h3>
                  <p className="text-sm text-slate-500">All botanist role applications have been reviewed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.map((app) => (
                  <Card key={app._id} className="border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">
                            {app.userId?.displayName || 'Applicant'}
                          </CardTitle>
                          <p className="text-xs text-slate-500">{app.userId?.email}</p>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-800 font-medium">
                          Seeking BOTANIST
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <span>Account age: {app.applicantStats?.accountAgeDays ?? 0} days</span>
                        <span>•</span>
                        <span>{app.applicantStats?.contributionsCount ?? 0} contributions</span>
                        <span>•</span>
                        <span>{app.applicantStats?.scansCount ?? 0} scans</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <strong className="text-xs font-semibold text-slate-700 uppercase">Motivation:</strong>
                        <p className="text-slate-700 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">
                          {app.motivation}
                        </p>
                      </div>
                      <div>
                        <strong className="text-xs font-semibold text-slate-700 uppercase">Qualifications:</strong>
                        <p className="text-slate-700 text-xs mt-1 line-clamp-2">
                          {app.qualifications}
                        </p>
                      </div>
                      {app.links && app.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {app.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-green-700 hover:underline flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded"
                            >
                              Link {idx + 1} <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsRejectDialogOpen(true);
                          }}
                          className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveApp(app)}
                          disabled={isProcessing}
                          className="bg-green-700 hover:bg-green-800 text-white text-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve & Grant Botanist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Reject Application Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Contributor Application</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Please provide constructive feedback explaining why this application cannot be accepted at this time.
            The user will be notified with this message.
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please gain more experience submitting community plant corrections or provide verified credentials in botany."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectApp}
              disabled={isProcessing || !rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
