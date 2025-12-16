# Local Borga MVP: Phase I – Core Services & Identity

**Field	      Value**
Product     Name	Local Borga
Document    Version	1.0 (MVP)
Owner	      Cosmos Kyeremeh
Date	      December 16, 2025
Status	    In Development (Stage 3)
Target      Launch	Q1 2026


1. ## Goal and Vision

 1.1 *Business Goal*
    To establish an efficient, trustworthy, and premium e-commerce platform that connects customers (local and diaspora) to high-quality Ghanaian local foodstuffs and specialized milling/production services.

 1.2 *Success Metrics (KPIs)*
    * Conversion Rate: 5% of homepage visitors proceed to either "Fresh Shop" or "Custom Order."

    * Service Adoption: 50% of initial 100 orders are for the Custom Milling/Production Room service.

    * Load Time: Homepage loads in under 3 seconds.


2. *Target Audience*

  2.1 Primary User
    * Locals (Ghana): Customers who require large quantities of goods or specific milled products (e.g., custom gari, flours) and value convenience and quality assurance.

    * Diaspora: Customers living abroad (e.g., US, UK) who need bulk, dried, or custom-milled foodstuffs packaged and shipped internationally.

  2.2 User Needs
    * A clear, reliable platform that differentiates between ready-stock retail and custom production.

    * A sophisticated, trustworthy design (Gold/Blue-Black palette) that conveys quality.


3. ## Scope of MVP (Phase I)
This phase focuses on the core user interface, data architecture, and clear separation of services.

|    Feature Area    | Included in MVP? |                                                Details                                                |
| :----------------- | :--------------- | :---------------------------------------------------------------------------------------------------- |
| Homepage Layout    | Yes              | Split-screen design to direct traffic: Fresh Goods (Retail) vs. Production Room (Custom Milling).     |
| Core Components    | Yes              | Basic Header, Footer, and Placeholder elements for future feature integration (e.g., "Product Card"). |
| Design & Branding  | Yes              | Implementation of the Gold (#FFD700) and Blue-Black (#000033) custom color palette.                   |
| Database Blueprint | Yes              | Initial schema documentation (DATABASE_SCHEMA.md) for Users, Products, Orders, and ProductionQueue.   |
| Product Listings   | ❌ No             | (Phase II) Full product catalog, filtering, searching, and individual product detail pages.           |
| Authentication     | ❌ No             | (Phase II) User login, signup, and profile management.                                                |
| Order/Payment Flow | ❌ No             | (Phase II) Actual checkout, payment gateway integration, and shipping calculation.                    |



4. # Detailed Requirements

4.1 *Frontend (Web-Client)*

| ID    | Requirement                                                                                                                 | Status      | Notes                                       |
| FE.01 | Implement a responsive two-column grid homepage layout (mobile stacked, desktop side-by-side).                              | In Progress | Implemented in page.tsx using Tailwind CSS. |
| FE.02 | Brand Colors: Use gold-500 for primary CTA backgrounds and blue-black-900 for text/headers.                                 | In Progress | Requires update to tailwind.config.ts.      |
| FE.03 | Retail Section: Must clearly feature a "Fresh & Ready Stock" heading (🛒) and a primary CTA: "START FRESH SHOPPING."         | ✅ Done      | Placeholder implemented.                    |
| FE.04 | Production Section: Must feature a "Custom Milling & Production" heading (⚙️) and a primary CTA: "BUILD YOUR CUSTOM ORDER." | ✅ Done      | Placeholder implemented.                    |
| FE.05 | Intercontinental Banner: Display a prominent, high-contrast banner at the bottom emphasizing "🌍 Intercontinental Shipping." | ✅ Done      | Implemented with bg-blue-black-900.         |


4.2 *Backend (Server) & Data*

| ID	| Requirement |	Status	| Notes |
| BE.01 |	Database Schema: Finalize and document the four core database tables (Users, Products, Orders, ProductionQueue). |	✅ Done	| Documented in docs/DATABASE_SCHEMA.md. |
| BE.02 |	Basic API: Create a placeholder (mock data) endpoint for /api/products to simulate product retrieval. |	❌ To Do	| This will be the next task after the homepage is complete. |