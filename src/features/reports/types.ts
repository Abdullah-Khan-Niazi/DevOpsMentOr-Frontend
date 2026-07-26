export interface Report {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}
