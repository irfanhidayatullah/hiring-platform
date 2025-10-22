import * as Yup from "yup";

export type FieldState = "mandatory" | "optional" | "off";
export type ProfileFieldKey =
  | "photo_profile"
  | "full_name"
  | "date_of_birth"
  | "gender"
  | "domicile"
  | "phone_number"
  | "email"
  | "linkedin_link";

export type FieldStateMap = Record<ProfileFieldKey, FieldState>;

/**
 * Builder schema dinamis mengikuti state tiap field.
 * - "mandatory": required
 * - "optional": tidak required (validasi format tetap diterapkan jika diisi)
 * - "off": disembunyikan, tidak divalidasi
 */
export function buildApplyJobSchema(states: FieldStateMap) {
  const isOn = (k: ProfileFieldKey) => states[k] !== "off";
  const isRequired = (k: ProfileFieldKey) => states[k] === "mandatory";

  const req = <T extends Yup.StringSchema>(s: T, k: ProfileFieldKey) =>
    isRequired(k) ? s.required(getRequiredMessage(k)) : s.notRequired();

  const stripIfOff = <T extends Yup.Schema<any>>(s: T, k: ProfileFieldKey) =>
    isOn(k) ? s : (Yup.mixed().strip(true) as any);

  const phonePattern = /^\+\d+\s\d{6,15}$/;

  return Yup.object().shape({
    photo_profile: stripIfOff(
      req(Yup.string(), "photo_profile"),
      "photo_profile"
    ),
    full_name: stripIfOff(req(Yup.string(), "full_name"), "full_name"),
    date_of_birth: stripIfOff(
      req(Yup.string(), "date_of_birth"),
      "date_of_birth"
    ),
    gender: stripIfOff(req(Yup.string(), "gender"), "gender"),
    domicile: stripIfOff(req(Yup.string(), "domicile"), "domicile"),
    phone_number: stripIfOff(
      req(
        Yup.string().test(
          "phone-format",
          "Invalid phone number",
          (val) => !val || phonePattern.test(val)
        ),
        "phone_number"
      ),
      "phone_number"
    ),
    email: stripIfOff(
      req(
        Yup.string().test(
          "email-format",
          "invalid email",
          (val) => !val || Yup.string().email().isValidSync(val)
        ),
        "email"
      ),
      "email"
    ),
    linkedin_link: stripIfOff(
      req(Yup.string(), "linkedin_link"),
      "linkedin_link"
    ),
  });
}

function getRequiredMessage(k: ProfileFieldKey): string {
  switch (k) {
    case "photo_profile":
      return "Photo Profile is required";
    case "full_name":
      return "Name is required";
    case "date_of_birth":
      return "Date of Birth is required";
    case "gender":
      return "Gender is required";
    case "domicile":
      return "Domicile is required";
    case "phone_number":
      return "Phone Number is required";
    case "email":
      return "Email is required";
    case "linkedin_link":
      return "Linkedin Link is required";
    default:
      return "This field is required";
  }
}

/** Backward compatibility: schema default (semua mandatory seperti sebelumnya) */
export const ApplyJobSchema = buildApplyJobSchema({
  photo_profile: "mandatory",
  full_name: "mandatory",
  date_of_birth: "mandatory",
  gender: "mandatory",
  domicile: "mandatory",
  phone_number: "mandatory",
  email: "mandatory",
  linkedin_link: "mandatory",
});
