# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3-beta] - 2024-09-22

### Added
- Initial release of CNGnManager
- Implemented `getBalance` method for retrieving account balance
- Implemented `getTransactionHistory` method for fetching transaction history
- Added `swapBetweenChains` method for swapping assets between different chains
- Implemented `depositForRedemption` method for depositing funds for redemption
- Added `createVirtualAccount` method for creating virtual accounts
- Implemented `whitelistAddress` method for whitelisting addresses
- Set up Jest testing framework with initial test suite
- Implemented error handling mechanism for API calls
- Added AES encryption for request payloads
- Implemented Ed25519 decryption for response data

### Changed
- Optimized API call performance for faster response times
- Improved error messages for better clarity and debugging

### Security
- Ensured secure handling of API keys and encryption keys
- Implemented additional input validation to prevent potential security vulnerabilities

### Notes
- This is a beta release. While it includes all core functionalities, it may contain bugs and is not recommended for production use.
- Feedback and bug reports are highly appreciated and will help improve future releases.

[Unreleased]: https://github.com/asc-africa/cngn-manager/compare/v1.0.3-beta...HEAD
[1.0.3-beta]: https://github.com/asc-africa/cngn-manager/releases/tag/v1.0.3-beta
