# Smart QR Promo Suite

A modern, responsive web application for managing promotional QR sticker campaigns for local businesses. This tool includes a business calculator, a client manager, an invoice generator, and a custom QR sticker layout creator.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/download/) (v20.19+ or v22.12+ for Vite 8)
- **npm** (comes with Node.js) or **yarn** or **pnpm**
- A [Supabase](https://supabase.com/) account and project (for the backend database and authentication).

## Environment Variables

This project requires connection to a Supabase project. You will need to create a `.env` file in the root of the project with your Supabase credentials.

Create a file named `.env` and add the following keys:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

## Step-by-Step Implementation Guide

Follow these steps to get the project up and running on your local machine:

### 1. Clone the Repository
Open your terminal and clone the repository using Git:
```bash
git clone https://github.com/synkraze-software-solutions/smart_label.git
cd smart_label
```

### 2. Install Dependencies
Install the required packages using npm:
```bash
npm install
```
*(If you use yarn or pnpm, run `yarn install` or `pnpm install` respectively)*

### 3. Setup Environment Variables
As mentioned in the Environment Variables section, create a `.env` file in the root directory:
```bash
touch .env
```
Open the `.env` file and paste your Supabase keys:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
```

### 4. Supabase Database Setup
The existing app uses `store_clients`, `print_runs`, `qr_codes`, and `invoices`.
Review the live schema, grants, and Row Level Security policies before deploying changes.
The publishable key is visible in the browser; database access must be limited by
Supabase permissions and policies. Never place a service-role or secret key in a
`VITE_` variable.

Existing losing stickers were not recorded in `qr_codes`. Keep their scan links
working until their original QR URL list has been recovered and migrated.

### 5. Start the Development Server
Run the Vite development server:
```bash
npm run dev
```

### 6. View the Application
Once the server starts, open your web browser and navigate to the local URL provided by Vite (usually `http://localhost:5173/`).

## Project Features
- **Responsive Design**: The app gracefully adapts to mobile, tablet, and desktop screens.
- **Client Manager**: Manage local store profiles, social media links, and QR package types.
- **Invoice Generator**: Create, download, and track professional invoices.
- **QR Layout Printer**: Generate and print sheets of dynamic promotional QR codes.
- **Consumer Simulator**: Preview the experience customers will see when scanning a QR code.

## Available Scripts

In the project directory, you can run:

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the app for production to the `dist` folder.
- `npm run preview` - Locally preview the production build.
- `npm run lint` - Runs Oxlint to check for code issues.
- `npm test` - Runs business-rule tests.

## Supplier labels

The supplier quote is for 50 × 30 mm variable-data polyester labels, at ₹0.50
per label before 18% GST and freight, with a 15,000-label MOQ. After a QR run
is saved, download its vendor CSV. Give the vendor only the CSV and approved
artwork; do not send database credentials. The CSV includes sticker order and
unique scan URL, but no winner flag. Confirm artwork, QR scan quality, and a
small proof before authorizing a full print batch.

## Technologies Used
- React 19
- Vite
- Supabase (Backend/Auth)
- Lucide React (Icons)
- Vanilla CSS (Styling)
