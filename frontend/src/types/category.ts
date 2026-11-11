export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  courseCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryTreeNode extends CategoryItem {
  children: CategoryTreeNode[];
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
}

export interface CategoryApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
