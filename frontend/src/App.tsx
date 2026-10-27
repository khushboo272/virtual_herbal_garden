import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./app/Layout";
import { RequireRole } from "./app/components/RequireRole";
import { RouteErrorBoundary } from "./app/components/RouteErrorBoundary";

// Page components
import { HomePage } from "./features/home";
import { LibraryPage, PlantDetailPage } from './features/library';
import { AIPlantDetectionPage } from "./features/ai-scanner";
import { VirtualGarden3DPage } from "./app/pages/VirtualGarden3DPage";
import { RemediesPage, RemedyDetailPage } from "./features/remedies";
import { NotFoundPage } from "./app/pages/NotFoundPage";
import {
  ToursHubPage,
  TourOverviewPage,
  TourCheckpointPage,
  TourCompletionPage,
  AdminToursListPage,
  AdminTourEditorPage,
  AdminTourAnalyticsPage,
} from "./features/tours";
import { MobileViewPage } from "./app/pages/MobileViewPage";
import { StyleGuidePage } from "./app/pages/StyleGuidePage";
import { OAuthCallbackPage } from "./app/pages/OAuthCallbackPage";

// Dashboard — unified layout (PRD §3.1)
import { DashboardLayout } from "./app/components/dashboard/DashboardLayout";
import { DashboardHome } from "./app/components/dashboard/DashboardHome";

// Dashboard sub-pages — dedicated components per route
import {
  AnalyticsOverviewPage,
  AIScannerStatsPage,
  UserGrowthPage,
  FeaturedContentPage,
  AIScannerPage,
  GuidedToursPage,
  SystemOverviewPage,
  FeatureFlagsPage,
  RoleManagementPage,
  AuditLogPage,
  AIModelConfigPage,
} from "./app/components/dashboard/pages";

// Admin feature pages (Part A)
import {
  ModerationQueuePage,
  ModerationReviewPage,
  ManageContentPlantsPage,
  ManageContentRemediesPage,
  AdminUserManagementPage,
  BecomeContributorPage,
} from "./features/admin";

// Shared dashboard pages (real implementations)
import {
  BookmarksPage,
  MyGardenPage,
  SettingsProfilePage,
  HelpSupportPage,
} from "./features/dashboard/shared";

// Botanist pages (real implementations)
import {
  MyContributionsPage,
  PlantEditorPage,
  RemedyEditorPage,
  SubmissionDetailsPage,
  AIFeedbackQueuePage,
} from "./features/botanist";

export default function App() {
  return (
    <RouteErrorBoundary isRoot>
      <BrowserRouter>
        <Toaster richColors position="top-right" closeButton duration={3500} />
      <Routes>
        {/* Pages with shared public navbar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/plant/:id" element={<PlantDetailPage />} />
          <Route path="/ai-detect" element={<RequireRole minimumRole="USER"><AIPlantDetectionPage /></RequireRole>} />
          <Route path="/remedies" element={<RemediesPage />} />
          <Route path="/remedies/:slug" element={<RemedyDetailPage />} />
          <Route path="/virtual-tour" element={<ToursHubPage />} />
          <Route path="/virtual-tour/:slug" element={<TourOverviewPage />} />
          <Route path="/virtual-tour/:slug/complete" element={<TourCompletionPage />} />
          <Route path="/virtual-tour/:slug/:key" element={<TourCheckpointPage />} />
          <Route path="/mobile" element={<MobileViewPage />} />
          <Route path="/style-guide" element={<StyleGuidePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Dashboard — unified route with sidebar layout (PRD §3.1) ── */}
        <Route
          path="/dashboard"
          element={<RequireRole minimumRole="USER"><DashboardLayout /></RequireRole>}
        >
          {/* Dashboard home — role-switch renderer */}
          <Route index element={<DashboardHome />} />

          {/* Shared sub-routes — all roles */}
          <Route path="garden" element={<MyGardenPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="scanner" element={<AIScannerPage />} />
          <Route path="profile" element={<SettingsProfilePage />} />
          <Route path="help" element={<HelpSupportPage />} />
          <Route path="tours" element={<GuidedToursPage />} />
          <Route path="become-contributor" element={<RequireRole minimumRole="USER" forbiddenRedirect="/dashboard"><BecomeContributorPage /></RequireRole>} />

          {/* Botanist sub-routes — protected with BOTANIST role */}
          <Route
            path="contributions"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><MyContributionsPage /></RequireRole>}
          />
          <Route
            path="contributions/new-plant"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><PlantEditorPage /></RequireRole>}
          />
          <Route
            path="contributions/new-remedy"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><RemedyEditorPage /></RequireRole>}
          />
          <Route
            path="contributions/plant/:id"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><PlantEditorPage /></RequireRole>}
          />
          <Route
            path="contributions/remedy/:id"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><RemedyEditorPage /></RequireRole>}
          />
          <Route
            path="contributions/:type/:id/review"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><SubmissionDetailsPage /></RequireRole>}
          />
          <Route
            path="ai-feedback"
            element={<RequireRole minimumRole="BOTANIST" forbiddenRedirect="/dashboard"><AIFeedbackQueuePage /></RequireRole>}
          />

          {/* Admin sub-routes — protected with per-route RequireRole(ADMIN) (BUG-036 fix) */}
          <Route path="moderation" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><ModerationQueuePage /></RequireRole>} />
          <Route path="moderation/:type/:id" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><ModerationReviewPage /></RequireRole>} />
          <Route path="content/plants" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><ManageContentPlantsPage /></RequireRole>} />
          <Route path="content/remedies" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><ManageContentRemediesPage /></RequireRole>} />
          <Route path="plants" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><ManageContentPlantsPage /></RequireRole>} />
          <Route path="users" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AdminUserManagementPage /></RequireRole>} />
          <Route path="analytics" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AnalyticsOverviewPage /></RequireRole>} />
          <Route path="analytics/scanner" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AIScannerStatsPage /></RequireRole>} />
          <Route path="analytics/users" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><UserGrowthPage /></RequireRole>} />
          <Route path="featured" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><FeaturedContentPage /></RequireRole>} />
          <Route path="tours/manage" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AdminToursListPage /></RequireRole>} />
          <Route path="tours/manage/new" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AdminTourEditorPage /></RequireRole>} />
          <Route path="tours/manage/:id" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AdminTourEditorPage /></RequireRole>} />
          <Route path="tours/analytics" element={<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard"><AdminTourAnalyticsPage /></RequireRole>} />

          {/* Super Admin sub-routes */}
          <Route path="system" element={<SystemOverviewPage />} />
          <Route path="system/feature-flags" element={<FeatureFlagsPage />} />
          <Route path="system/role-management" element={<RoleManagementPage />} />
          <Route path="system/audit-log" element={<AuditLogPage />} />
          <Route path="system/ai-model-config" element={<AIModelConfigPage />} />
        </Route>

        {/* ── Redirect aliases (keeps old URLs working) ── */}
        <Route path="/contribute" element={<Navigate to="/dashboard/contributions" replace />} />
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

        {/* Full-screen page without navbar (immersive experience) */}
        <Route path="/garden-3d" element={<VirtualGarden3DPage />} />

        {/* OAuth callback — captures token from Google redirect */}
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  </RouteErrorBoundary>
  );
}
