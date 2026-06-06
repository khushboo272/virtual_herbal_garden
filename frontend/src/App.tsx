import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./app/Layout";
import { RequireRole } from "./app/components/RequireRole";

// Page components
import { HomePageWrapper } from "./app/pages/HomePageWrapper";
import { PlantLibraryPage } from "./app/pages/PlantLibraryPage";
import { PlantDetailPage } from "./app/pages/PlantDetailPage";
import { AIPlantDetectionPage } from "./app/pages/AIPlantDetectionPage";
import { VirtualGarden3DPage } from "./app/pages/VirtualGarden3DPage";
import { RemediesPageWrapper } from "./app/pages/RemediesPageWrapper";
import { VirtualTourPage } from "./app/pages/VirtualTourPage";
import { MobileViewPage } from "./app/pages/MobileViewPage";
import { StyleGuidePage } from "./app/pages/StyleGuidePage";
import { OAuthCallbackPage } from "./app/pages/OAuthCallbackPage";

// Dashboard — unified layout (PRD §3.1)
import { DashboardLayout } from "./app/components/dashboard/DashboardLayout";
import { DashboardHome } from "./app/components/dashboard/DashboardHome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages with shared public navbar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/library" element={<PlantLibraryPage />} />
          <Route path="/plant/:id" element={<PlantDetailPage />} />
          <Route path="/ai-detect" element={<RequireRole minimumRole="USER"><AIPlantDetectionPage /></RequireRole>} />
          <Route path="/remedies" element={<RemediesPageWrapper />} />
          <Route path="/virtual-tour" element={<VirtualTourPage />} />
          <Route path="/mobile" element={<MobileViewPage />} />
          <Route path="/style-guide" element={<StyleGuidePage />} />
        </Route>

        {/* ── Dashboard — unified route with sidebar layout (PRD §3.1) ── */}
        <Route
          path="/dashboard"
          element={<RequireRole minimumRole="USER"><DashboardLayout /></RequireRole>}
        >
          {/* Dashboard home — role-switch renderer */}
          <Route index element={<DashboardHome />} />

          {/* Sub-routes — stubs for now, will be filled per PRD */}
          <Route path="garden" element={<DashboardHome />} />
          <Route path="bookmarks" element={<DashboardHome />} />
          <Route path="scanner" element={<DashboardHome />} />
          <Route path="profile" element={<DashboardHome />} />
          <Route path="help" element={<DashboardHome />} />
          <Route path="tours" element={<DashboardHome />} />

          {/* Botanist sub-routes */}
          <Route path="contributions" element={<DashboardHome />} />
          <Route path="contributions/new-plant" element={<DashboardHome />} />
          <Route path="contributions/new-remedy" element={<DashboardHome />} />
          <Route path="ai-feedback" element={<DashboardHome />} />

          {/* Admin sub-routes */}
          <Route path="moderation" element={<DashboardHome />} />
          <Route path="analytics" element={<DashboardHome />} />
          <Route path="analytics/scanner" element={<DashboardHome />} />
          <Route path="analytics/users" element={<DashboardHome />} />
          <Route path="featured" element={<DashboardHome />} />
          <Route path="users" element={<DashboardHome />} />
          <Route path="tours/manage" element={<DashboardHome />} />
          <Route path="tours/manage/new" element={<DashboardHome />} />
          <Route path="tours/analytics" element={<DashboardHome />} />

          {/* Super Admin sub-routes */}
          <Route path="system" element={<DashboardHome />} />
          <Route path="system/feature-flags" element={<DashboardHome />} />
          <Route path="system/role-management" element={<DashboardHome />} />
          <Route path="system/audit-log" element={<DashboardHome />} />
          <Route path="system/ai-model-config" element={<DashboardHome />} />
        </Route>

        {/* ── Redirect aliases (keeps old URLs working) ── */}
        <Route path="/contribute" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

        {/* Full-screen page without navbar (immersive experience) */}
        <Route path="/garden-3d" element={<VirtualGarden3DPage />} />

        {/* OAuth callback — captures token from Google redirect */}
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}
