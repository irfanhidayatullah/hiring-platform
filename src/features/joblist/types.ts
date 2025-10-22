export type CalendarValue = Date | null;

export type Job = {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  status: "active" | "inactive" | "draft";
  created_at: string;
  company?: {
    company_name: string | null;
    company_logo_url: string | null;
  } | null;
};
