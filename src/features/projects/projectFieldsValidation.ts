const PROJECT_FIELDS_LIMITS = {
  nameMin: 3,
  nameMax: 100,
  clientNameMax: 100,
  jobCodeMax: 50
} as const;

type ValidationError = { key: string; params?: Record<string, number> } | null;

export const validateProjectName = (value: string): ValidationError =>
{
  const trimmed = value.trim();
  if (trimmed.length === 0) return { key: 'project.validation.nameRequired' };
  if (trimmed.length < PROJECT_FIELDS_LIMITS.nameMin) return { key: 'project.validation.nameMinLength', params: { min: PROJECT_FIELDS_LIMITS.nameMin } };
  if (trimmed.length > PROJECT_FIELDS_LIMITS.nameMax) return { key: 'project.validation.nameTooLong', params: { max: PROJECT_FIELDS_LIMITS.nameMax } };
  return null;
};

export const validateClientName = (value: string): ValidationError =>
{
  if (value.trim().length > PROJECT_FIELDS_LIMITS.clientNameMax) return { key: 'project.validation.clientNameTooLong', params: { max: PROJECT_FIELDS_LIMITS.clientNameMax } };
  return null;
};

export const validateJobCode = (value: string): ValidationError =>
{
  if (value.trim().length > PROJECT_FIELDS_LIMITS.jobCodeMax) return { key: 'project.validation.jobCodeTooLong', params: { max: PROJECT_FIELDS_LIMITS.jobCodeMax } };
  return null;
};
