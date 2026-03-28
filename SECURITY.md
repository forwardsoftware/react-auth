# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly. **Do not open a public GitHub issue.**

Instead, please use one of the following methods:

### GitHub Private Vulnerability Reporting

Use [GitHub's private vulnerability reporting](https://github.com/forwardsoftware/react-auth/security/advisories/new) to submit a report directly through the repository. This is the preferred method.

### Email

Send an email to the maintainers at [security@forwardsoftware.solutions](mailto:security@forwardsoftware.solutions) with:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fix (if available)

## Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within **48 hours**.
- **Assessment**: We will assess the vulnerability and provide an initial response within **5 business days**.
- **Fix**: Critical vulnerabilities will be prioritized and patched as soon as possible.

## Supported Versions

Security updates are provided for the latest major version of each package:

| Package | Supported Version |
| --- | --- |
| `@forward-software/react-auth` | `2.x` |
| `@forward-software/react-auth-google` | `1.x` |
| `@forward-software/react-auth-apple` | `1.x` |

## Scope

The following areas are in scope for security reports:

- Token handling and storage
- Authentication flow vulnerabilities
- Credential leakage
- Cross-site scripting (XSS) in rendered components
- Dependency vulnerabilities

## Acknowledgments

We appreciate the efforts of security researchers and will credit reporters (with their permission) in the release notes when a vulnerability is fixed.
