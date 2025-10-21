import JobApplicantListPage from "@/features/admin/jobs";

export default async function JobApplicantList({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <JobApplicantListPage jobSlug={slug} />;
}
