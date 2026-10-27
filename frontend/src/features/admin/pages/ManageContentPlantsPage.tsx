import React from 'react';
import { ContentManagementView } from '../components/ContentManagementView';

export function ManageContentPlantsPage() {
  return (
    <ContentManagementView
      type="plants"
      title="Plant Management"
      description="View, feature, edit, publish, or remove botanical specimens from the active library"
    />
  );
}
