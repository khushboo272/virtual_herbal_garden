import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./app/Layout";

// Page components
import { HomePageWrapper } from "./app/pages/HomePageWrapper";
import { PlantLibraryPage } from "./app/pages/PlantLibraryPage";
import { PlantDetailPage } from "./app/pages/PlantDetailPage";
import { AIPlantDetectionPage } from "./app/pages/AIPlantDetectionPage";
import { VirtualGarden3DPage } from "./app/pages/VirtualGarden3DPage";
import { RemediesPageWrapper } from "./app/pages/RemediesPageWrapper";
import { VirtualTourPage } from "./app/pages/VirtualTourPage";
import { UserDashboardPage } from "./app/pages/UserDashboardPage";
import { AdminPanelPage } from "./app/pages/AdminPanelPage";
import { MobileViewPage } from "./app/pages/MobileViewPage";
import { StyleGuidePage } from "./app/pages/StyleGuidePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages with shared navbar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/library" element={<PlantLibraryPage />} />
          <Route path="/plant/:id" element={<PlantDetailPage />} />
          <Route path="/ai-detect" element={<AIPlantDetectionPage />} />
          <Route path="/remedies" element={<RemediesPageWrapper />} />
          <Route path="/virtual-tour" element={<VirtualTourPage />} />
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
          <Route path="/mobile" element={<MobileViewPage />} />
          <Route path="/style-guide" element={<StyleGuidePage />} />
        </Route>

        {/* Full-screen page without navbar (immersive experience) */}
        <Route path="/garden-3d" element={<VirtualGarden3DPage />} />
      </Routes>
    </BrowserRouter>
  );
}
