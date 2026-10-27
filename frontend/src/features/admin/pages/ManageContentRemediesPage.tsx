import React from 'react';
import { ContentManagementView } from '../components/ContentManagementView';

export function ManageContentRemediesPage() {
  return (
    <ContentManagementView
      type="remedies"
      title="Remedy Management"
      description="View, feature, edit, publish, or remove traditional herbal preparations"
    />
  );
}
