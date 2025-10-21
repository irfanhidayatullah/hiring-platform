import * as Yup from "yup";

export const CreateJobSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  department: Yup.string().required("Type is required"),
  description: Yup.string().required("Job description is required"),
  needed: Yup.string().required("Number of candidate needed is required"),
  salary_min: Yup.string().required("Minimum salary is required"),
  salary_max: Yup.string().required("Maximum salary is required"),
});
