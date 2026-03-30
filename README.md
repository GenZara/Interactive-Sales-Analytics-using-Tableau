# Interactive Sales Dashboard System (SalesIQ)

A complete, production-grade Interactive Sales Dashboard similar to Tableau, built with React.js, Node.js + Express, and Recharts.

![Dashboard Preview](frontend/public/logo192.png) 

## 🚀 Features

*   **Realistic Synthetic Dataset**: Generates 1500+ realistic retail sales records with seasonal trends, discount-profit correlations, and regional variations.
*   **Backend API (Node.js/Express)**: 
    *   In-memory data processing for blazing fast response times.
    *   Dynamic aggregation, grouping, and filtering endpoints.
    *   Calculates top items, insights, trends, and anomalies.
*   **Modern React Frontend**:
    *   **3 Distinct Pages**: Dashboard Overview, Sales Analytics, and Customer Insights.
    *   **Advanced Visualizations**: Trend lines with drill-down (Month → Day), Bar, Radar, Donut, and Scatter-like charts using `recharts`.
    *   **Tableau-like Interactivity**: Click on any chart element (category bar, region slice, segment bar) to globally **cross-filter** all other charts.
    *   **Dynamic Filtering**: Filter by date range, category, region, segment, payment mode, and search by text.
*   **Premium UI/UX**:
    *   Glassmorphism effects, fluid animations, and a cohesive design system.
    *   Dark & Light mode toggle.
    *   Paginated, sortable Data Table for transaction records.
    *   PDF Export generated client-side using `html2canvas` and `jsPDF`.
    *   Skeleton loaders for smooth data transitions.

## 📂 Project Structure

```
interactive sales srm 1.5k/
├── dataset/
│   ├── generate.js        # Script to generate synthetic data
│   ├── sales_data.json    # Generated JSON dataset (used by backend)
│   └── sales_data.csv     # Generated CSV dataset
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── dataLayer.js # In-memory DB and aggregation logic
│   │   ├── middleware/
│   │   ├── routes/
│   │   │   └── sales.js     # API Endpoints
│   │   └── server.js        # Express app root
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/      # Reusable UI (Sidebar, FilterBar, KpiCards, DataTable)
    │   │   └── charts/      # Recharts wrappers with cross-filtering logic
    │   ├── context/         # Theme and Filter state management
    │   ├── pages/           # Overview, Analytics, Customers
    │   ├── services/        # API client map
    │   ├── utils/           # Formatters & Constants
    │   ├── App.js           # Router & Layout
    │   └── index.css        # Global design system & tokens
    └── package.json
```

## 🛠️ Step-by-Step Setup

### Step 1: Generate the Dataset
1. Open a terminal and navigate to the `dataset` directory.
2. Run the generation script:
   ```bash
   cd dataset
   node generate.js
   ```
   *(Note: The system has already generated the initial dataset for you).*

### Step 2: Start the Backend Server
1. Open a terminal and navigate to the `backend` directory.
2. Install dependencies and start the server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The API will start running on `http://localhost:5000`.

### Step 3: Start the Frontend Application
1. Open a new terminal and navigate to the `frontend` directory.
2. Install dependencies and start the React app:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The frontend will automatically open in your browser at `http://localhost:3000`.

## 🧠 Insights Engine
The application automatically parses the dataset to find:
*   Highest performing product categories.
*   Regions with the largest profit margins.
*   Impact of discounts on overall profit (highlighting instances where deep discounts cause net losses).
*   Flagging specific anomalies (orders with `profit < -500`) to highlight troubled regions or segments.
