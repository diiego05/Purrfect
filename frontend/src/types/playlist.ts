export interface PlaylistAuthor {
  _id: string;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  avatarUrl?: string;
}

export interface PlaylistCourseItem {
  _id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  durationHours?: number;
  level?: string;
  averageRating?: number;
  totalStudents?: number;
  shortDescription?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  userId: PlaylistAuthor;
  isPublic: boolean;
  courses: PlaylistCourseItem[];
  followers: string[];
  courseCount?: number;
  followerCount?: number;
  isFollowedByMe?: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPlaylistsResponse {
  success: boolean;
  playlists: Playlist[];
}

export interface MyPlaylistsResponse {
  success: boolean;
  created: Playlist[];
  followed: Playlist[];
  limits?: {
    maxPlaylists: number;
    maxCoursesPerPlaylist: number;
  };
}

export interface PlaylistDetailResponse {
  success: boolean;
  playlist: Playlist;
}
