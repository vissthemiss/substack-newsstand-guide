export type Article = {
  id: string;
  postId?: string;
  title: string;
  subtitle: string | null;
  date: string;
  url: string;
  isPaid: boolean;
  tags: string[];
  coverImage: string | null;
};
