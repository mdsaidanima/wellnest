# WellNest Navigation Refinement Plan

The user is experiencing unexpected redirects to the login page when navigating the site. This is primarily because:
1. Public pages like `about.html` still display links to protected pages (Tracker, Health Tools) in their navbar.
2. Clicking these links while unauthenticated triggers the redirection logic on those target pages.
3. The user wants the `index.html` (and likely other public pages) to only show Home, About Us, Login, and Signup.

## Proposed Changes

### 1. Synchronize Public Navbars
Update the navigation bars in `index.html`, `about.html`, `login.html`, and `signup.html` to be consistent. They should only show:
- Home
- About Us
- Login
- Sign Up

### 2. Standardize Redirection Logic
Ensure that protected pages (`dashboard-new.html`, `tracker.html`, `profile.html`, etc.) have consistent login checks (checking for both `userId` and `userEmail` in `localStorage`).

### 3. Clear Cache & Restart Server
Restart the Spring Boot server to ensure all static file changes are picked up.

## Execution Steps

1. **Modify `src/main/resources/static/about.html`**: Simplify the navbar to match `index.html`.
2. **Modify `src/main/resources/static/tracker.html`**: Ensure the navbar there is also clean, or consistent with the user's role if logged in.
3. **Modify `src/main/resources/static/health-tools.html`**: Simplify the navbar.
4. **Final Restart**: Restart the server and verify.
