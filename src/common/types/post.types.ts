export interface PostData {
  id: string;
  author_id: string;
  content: string;
  mood: string;
  category: string;
  community: string; // Community field for filtering
  created_at: any;
  updated_at: any;
  likes_count: number;
  comments_count: number;
  support_count: number;
  views_count: number;
  status: string;
  is_anonymous: boolean;
}

export interface CommentData {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: any;
  updated_at: any;
  likes_count: number;
  status: string;
  is_anonymous: boolean;
}

export interface SupportData {
  id: string;
  post_id: string;
  user_id: string;
  type: string;
  message: string;
  created_at: any;
}
