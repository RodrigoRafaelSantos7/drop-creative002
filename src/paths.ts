export const indexPath = () => "/";

// Auth
export const signInPath = () => "/auth/sign-in";
export const signUpPath = () => "/auth/sign-up";

// Protected
export const dashboardPath = (route?: string) =>
  route ? `/dashboard/${route}` : "/dashboard";

export const canvasPath = (userSlug: string, projectSlug: string) =>
  `/dashboard/${encodeURIComponent(userSlug)}/canvas?project=${encodeURIComponent(projectSlug)}`;

export const styleGuidePath = (userSlug: string, projectSlug: string) =>
  `/dashboard/${encodeURIComponent(userSlug)}/style-guide?project=${encodeURIComponent(projectSlug)}`;

export const billingPath = (profileName: string) =>
  `/billing/${encodeURIComponent(profileName)}`;