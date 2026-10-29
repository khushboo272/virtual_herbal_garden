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
  FeatureFlagsPage,
  AIModelConfigPage,
} from "./app/components/dashboard/pages";
import {
  SystemOverviewPage,
  RoleManagementPage,
  AuditLogPage,
  MaintenanceGuard,
  RequireFeature,
} from "./features/system";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";


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
        <FeatureFlagsProvider>
          <Toaster richColors position="top-right" closeButton duration={3500} />
          <MaintenanceGuard>
            <Routes>
          {/* Pages with shared public navbar layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/plant/:id" element={<PlantDetailPage />} />
            <Route
              path="/ai-detect"
              element={
                <RequireRole minimumRole="USER">
                  <RequireFeature featureKey="ai_scanner" featureName="AI Plant Scanner">
                    <AIPlantDetectionPage />
                  </RequireFeature>
                </RequireRole>
              }
            />
            <Route path="/remedies" element={<RemediesPage />} />
            <Route path="/remedies/:slug" element={<RemedyDetailPage />} />
            <Route
              path="/virtual-tour"
              element={
                <RequireFeature featureKey="guided_tours" featureName="Guided Virtual Tours">
                  <ToursHubPage />
                </RequireFeature>
              }
            />
            <Route
              path="/virtual-tour/:slug"
              element={
                <RequireFeature featureKey="guided_tours" featureName="Guided Virtual Tours">
                  <TourOverviewPage />
                </RequireFeature>
              }
            />
            <Route
              path="/virtual-tour/:slug/complete"
              element={
                <RequireFeature featureKey="guided_tours" featureName="Guided Virtual Tours">
                  <TourCompletionPage />
                </RequireFeature>
              }
            />
            <Route
              path="/virtual-tour/:slug/:key"
              element={
                <RequireFeature featureKey="guided_tours" featureName="Guided Virtual Tours">
                  <TourCheckpointPage />
                </RequireFeature>
              }
            />
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
            <Route
              path="scanner"
              element={
                <RequireFeature featureKey="ai_scanner" featureName="AI Plant Scanner">
                  <AIScannerPage />
                </RequireFeature>
              }
            />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="help" element={<HelpSupportPage />} />
            <Route
              path="tours"
              element={
                <RequireFeature featureKey="guided_tours" featureName="Guided Virtual Tours">
                  <GuidedToursPage />
                </RequireFeature>
              }
            />
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
            <Route path="system" element={<RequireRole minimumRole="SUPER_ADMIN" forbiddenRedirect="/dashboard"><SystemOverviewPage /></RequireRole>} />
            <Route path="system/feature-flags" element={<RequireRole minimumRole="SUPER_ADMIN" forbiddenRedirect="/dashboard"><FeatureFlagsPage /></RequireRole>} />
            <Route path="system/role-management" element={<RequireRole minimumRole="SUPER_ADMIN" forbiddenRedirect="/dashboard"><RoleManagementPage /></RequireRole>} />
            <Route path="system/audit-log" element={<RequireRole minimumRole="SUPER_ADMIN" forbiddenRedirect="/dashboard"><AuditLogPage /></RequireRole>} />
            <Route path="system/ai-model-config" element={<RequireRole minimumRole="SUPER_ADMIN" forbiddenRedirect="/dashboard"><AIModelConfigPage /></RequireRole>} />

            {/* Admin redirect aliases (prevents 404 on legacy or catalog links) */}
            <Route path="admin/users" element={<Navigate to="/dashboard/users" replace />} />
            <Route path="admin/content/plants" element={<Navigate to="/dashboard/content/plants" replace />} />
            <Route path="admin/content/remedies" element={<Navigate to="/dashboard/content/remedies" replace />} />
            <Route path="admin/content" element={<Navigate to="/dashboard/content/plants" replace />} />
            <Route path="admin/tours" element={<Navigate to="/dashboard/tours/manage" replace />} />
          </Route>

          {/* ── Redirect aliases (keeps old URLs working) ── */}
          <Route path="/contribute" element={<Navigate to="/dashboard/contributions" replace />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

          {/* Full-screen page without navbar (immersive experience) */}
          <Route
            path="/garden-3d"
            element={
              <RequireFeature featureKey="3d_garden" featureName="3D Virtual Garden">
                <VirtualGarden3DPage />
              </RequireFeature>
            }
          />

          {/* OAuth callback — captures token from Google redirect */}
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        </Routes>
      </MaintenanceGuard>
      </FeatureFlagsProvider>
      </BrowserRouter>
    </RouteErrorBoundary>
  );
}
