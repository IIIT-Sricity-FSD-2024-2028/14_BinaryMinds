export enum Role {
  PLATFORM_ADMIN = 'platform_admin',
  APPLICANT = 'applicant',
  FIELD_OFFICER = 'field_officer',
  DEPARTMENT_OFFICER = 'department_officer',
  MUNICIPAL_COMMISSIONER = 'municipal_commissioner',
  // Kept as an internal source-compatibility alias while existing controllers
  // retain their established permission declarations.
  SUPER_USER = 'municipal_commissioner',
}
