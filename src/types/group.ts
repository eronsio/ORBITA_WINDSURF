export interface Group {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  contactCount?: number;
}

export interface GroupWithContacts extends Group {
  contactIds: string[];
}
