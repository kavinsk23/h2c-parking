/**
 * Check if an email belongs to an admin
 * You can modify this logic based on your requirements:
 * - Check against specific email addresses
 * - Check against email domains (@company.com)
 * - Use a combination of both
 */
export const isAdminEmail = (email: string): boolean => {
  // Get admin emails from environment variable
  const adminEmails =
    import.meta.env.VITE_ADMIN_EMAILS?.split(",").map((e: string) =>
      e.trim().toLowerCase(),
    ) || [];

  // Check if email is in admin list
  if (adminEmails.includes(email.toLowerCase())) {
    return true;
  }

  // Optional: Check for admin domain (e.g., all @h2cparking.com are admins)
  const adminDomains = ["@h2cparking.com", "@admin.h2c.com"];
  const emailDomain = email.toLowerCase().substring(email.indexOf("@"));

  if (adminDomains.some((domain) => emailDomain === domain)) {
    return true;
  }

  return false;
};

/**
 * Determine user role based on email
 */
export const getUserRole = (email: string): "user" | "admin" => {
  return isAdminEmail(email) ? "admin" : "user";
};
