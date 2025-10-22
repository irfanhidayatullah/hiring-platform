import * as Yup from "yup";

export const ApplyJobSchema = Yup.object().shape({
  photo_profile: Yup.string().required("Photo Profile is required"),
  full_name: Yup.string().required("Name is required"),
  date_of_birth: Yup.string().required("Date of Birth is required"),
  gender: Yup.string().required("Gender is required"),
  domicile: Yup.string().required("Domicilie is required"),
  phone_number: Yup.string()
    .required("Phone Number is required")
    .matches(/^\+\d+\s\d{6,15}$/, "Invalid phone number"),
  email: Yup.string().email("invalid email").required("Email is required"),
  linkedin_link: Yup.string().required("Linkedin Link is required"),
});
