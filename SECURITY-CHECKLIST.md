# Security Checklist for Willing Tree Deployment

## Pre-Deployment Checklist

### Environment Variables
- [ ] All API keys are stored in environment variables, not in code
- [ ] `.env` files are in `.gitignore` and never committed
- [ ] Production secrets are configured in Vercel dashboard
- [ ] Firebase config uses environment variables
- [ ] No hardcoded credentials in source code

### Security Headers (Vercel)
- [ ] Content Security Policy (CSP) configured
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection enabled
- [ ] Referrer-Policy configured
- [ ] Strict-Transport-Security (HSTS) enabled
- [ ] Permissions-Policy configured

### Code Security
- [ ] No use of `innerHTML` or `dangerouslySetInnerHTML`
- [ ] All user inputs are sanitized
- [ ] No use of `eval()` or `new Function()`
- [ ] External URLs are validated before redirect
- [ ] API endpoints use proper authentication

### Path Configuration
- [ ] Base paths correctly set for deployment target:
  - Vercel: `/`
  - GitHub Pages: `/willing-tree/`
- [ ] Service worker scope properly restricted
- [ ] All asset paths are absolute from base

### Third-Party Services
- [ ] Firebase security rules configured
- [ ] Stripe webhook endpoints verified
- [ ] API rate limiting in place
- [ ] CORS properly configured

## Post-Deployment Testing

### Security Scanning
- [ ] Test CSP headers: https://csp-evaluator.withgoogle.com/
- [ ] Security headers scan: https://securityheaders.com/
- [ ] SSL Labs test: https://www.ssllabs.com/ssltest/
- [ ] OWASP ZAP scan for vulnerabilities

### Functional Testing
- [ ] Service worker registration works
- [ ] PWA installation works
- [ ] All assets load correctly (no mixed content)
- [ ] Authentication flow secure
- [ ] Payment flow (if applicable) works over HTTPS

### Path Testing
- [ ] Test on Vercel with root path (`/`)
- [ ] Test on GitHub Pages with subfolder (`/willing-tree/`)
- [ ] Verify manifest.json loads correctly
- [ ] Check all icon paths resolve

## Regular Maintenance

### Monthly
- [ ] Review and rotate API keys
- [ ] Check for dependency vulnerabilities: `npm audit`
- [ ] Review security headers effectiveness
- [ ] Check for exposed secrets in git history

### Quarterly
- [ ] Full security audit
- [ ] Update CSP policy as needed
- [ ] Review Firebase security rules
- [ ] Test disaster recovery procedures

## Incident Response

If a security issue is detected:
1. Immediately revoke any exposed credentials
2. Deploy fix to production
3. Review logs for any unauthorized access
4. Notify affected users if required
5. Document incident and lessons learned

## Contact

Security concerns should be reported to: [Add security contact email]

Last updated: 2025-09-25

## API Key Exposure Resolution (2025-09-25)

### ✅ Resolved GitHub Security Alert
**Issue**: Google API Key exposed in `scripts/create-test-user.mjs`

### Actions Taken:
1. **Removed all files with exposed API keys**:
   - Deleted 8 test scripts containing hardcoded Firebase API keys
   - Created secure replacement using environment variables

2. **Updated Security Measures**:
   - ✅ Enhanced .gitignore with patterns for test scripts
   - ✅ Added security warnings to scripts/README.md
   - ✅ Created secure `scripts/reset-password.mjs` using env vars
   - ✅ Verified no remaining exposed keys in codebase

3. **Prevention**:
   - All Firebase configuration now read from `.env` file
   - Comprehensive .gitignore patterns prevent future exposures
   - Documentation updated with security best practices

**Status**: ✅ RESOLVED - No exposed API keys remain in repository