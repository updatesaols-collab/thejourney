import { permanentRedirect } from "next/navigation";

type LegacyBlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyBlogDetailPage({
  params,
}: LegacyBlogDetailPageProps) {
  const { slug } = await params;
  permanentRedirect(`/library/article/${slug}`);
}
