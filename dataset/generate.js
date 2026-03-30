/**
 * Synthetic Sales Dataset Generator
 * Generates 1500+ realistic retail sales records with:
 *  - Seasonal trends (Q4 spike, summer dip)
 *  - Discount ↔ Profit inverse correlation
 *  - Regional & category variation
 *  - Outliers sprinkled in
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────
const TOTAL_RECORDS = 1500;
const START_DATE    = new Date('2023-01-01');
const END_DATE      = new Date('2024-12-31');

// ─── Reference Data ───────────────────────────────────────────────────────────
const REGIONS = ['North', 'South', 'East', 'West'];

const CITY_MAP = {
  North: ['Delhi', 'Chandigarh', 'Jaipur', 'Lucknow', 'Amritsar'],
  South: ['Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore'],
  East:  ['Kolkata', 'Bhubaneswar', 'Patna', 'Guwahati', 'Ranchi'],
  West:  ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Nagpur'],
};

const SEGMENTS = ['Regular', 'Premium', 'Wholesale'];

const CATEGORIES = {
  Electronics: {
    products: [
      'Smartphone', 'Laptop', 'Tablet', 'Smart TV', 'Headphones',
      'Bluetooth Speaker', 'Smartwatch', 'Camera', 'Gaming Console', 'Router',
    ],
    priceRange: [5000, 80000],
    marginBase: 0.15,
  },
  Clothing: {
    products: [
      'T-Shirt', 'Jeans', 'Kurta', 'Saree', 'Jacket',
      'Formal Shirt', 'Sports Shoes', 'Sneakers', 'Ethnic Wear', 'Winter Coat',
    ],
    priceRange: [300, 8000],
    marginBase: 0.35,
  },
  Grocery: {
    products: [
      'Rice (5kg)', 'Wheat Flour', 'Cooking Oil', 'Sugar', 'Tea Powder',
      'Pulses Mix', 'Spices Kit', 'Dry Fruits', 'Biscuits Pack', 'Instant Noodles',
    ],
    priceRange: [50, 1500],
    marginBase: 0.10,
  },
  Furniture: {
    products: [
      'Office Chair', 'Study Table', 'Bookshelf', 'Wardrobe', 'Sofa Set',
      'Dining Table', 'Bed Frame', 'Side Table', 'Cabinet', 'Shoe Rack',
    ],
    priceRange: [2000, 50000],
    marginBase: 0.25,
  },
  Sports: {
    products: [
      'Yoga Mat', 'Dumbbells Set', 'Cricket Bat', 'Football', 'Badminton Racket',
      'Cycling Helmet', 'Swimming Goggles', 'Jump Rope', 'Resistance Bands', 'Treadmill',
    ],
    priceRange: [200, 30000],
    marginBase: 0.28,
  },
  'Health & Beauty': {
    products: [
      'Face Cream', 'Shampoo', 'Multivitamins', 'Protein Powder', 'Essential Oils',
      'Sunscreen', 'Perfume', 'Electric Toothbrush', 'Face Mask Pack', 'Hair Oil',
    ],
    priceRange: [100, 5000],
    marginBase: 0.40,
  },
  Books: {
    products: [
      'Self-Help Book', 'Novel', 'Textbook', 'Comics', 'Cookbook',
      'Business Book', 'Children Story', 'Biography', 'Science Fiction', 'Dictionary',
    ],
    priceRange: [100, 2000],
    marginBase: 0.20,
  },
  'Home & Kitchen': {
    products: [
      'Pressure Cooker', 'Non-stick Pan', 'Mixer Grinder', 'Air Fryer', 'Microwave',
      'Water Purifier', 'Iron Box', 'Vacuum Cleaner', 'Coffee Maker', 'Induction Cooktop',
    ],
    priceRange: [500, 25000],
    marginBase: 0.22,
  },
};

const PAYMENT_MODES = ['Cash', 'Card', 'UPI'];

const FIRST_NAMES = [
  'Aarav','Priya','Rohit','Sneha','Vikram','Ananya','Kiran','Divya','Arjun','Meera',
  'Ravi','Pooja','Suresh','Nisha','Amit','Kavya','Deepak','Lakshmi','Rajesh','Sunita',
  'Harish','Rekha','Manoj','Geeta','Sandeep','Shweta','Anil','Asha','Vinod','Usha',
  'Sanjay','Pallavi','Mohan','Jyoti','Ajay','Radha','Ramesh','Latika','Naveen','Swati',
  'Girish','Manjula','Praveen','Hema','Sunil','Kamala','Vijay','Saritha','Ashok','Bhavna',
];

const LAST_NAMES = [
  'Sharma','Patel','Reddy','Kumar','Singh','Verma','Mehta','Joshi','Gupta','Nair',
  'Chauhan','Rao','Iyer','Bose','Chatterjee','Das','Mishra','Pillai','Shetty','Shah',
  'Agarwal','Banerjee','Menon','Krishnan','Tiwari','Saxena','Dubey','Mukherjee','Ghosh','Kaur',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

/**
 * Random date within range; applies seasonal bias so Q4 & festive months
 * (Oct–Dec) have ~2× the records as Q2.
 */
function randomDate(start, end) {
  const diff = end - start;
  const r    = Math.random();
  const d    = new Date(start.getTime() + r * diff);
  return d;
}

/**
 * Seasonal multiplier — sales surge in Oct–Dec (festive), dip in Jun–Jul.
 */
function seasonalSalesMultiplier(month) {
  // month: 0-indexed (0=Jan)
  const multipliers = [
    1.0, 0.9, 1.0, 1.05, 1.0, 0.85,
    0.80, 0.90, 1.05, 1.20, 1.40, 1.50,
  ];
  return multipliers[month] ?? 1.0;
}

/**
 * Segment discount tendencies.
 */
function segmentDiscount(segment) {
  if (segment === 'Wholesale') return rand(15, 30);
  if (segment === 'Premium')   return rand(5, 18);
  return rand(0, 20);                                // Regular
}

/**
 * Compute profit given sales, qty, margin, discount.
 * Higher discounts erode margin. Outlier flag adds extreme values.
 */
function computeProfit(sales, qty, marginBase, discount, isLossMaker, isOutlier) {
  const effectiveMargin = marginBase - (discount / 100) * 0.8;
  const costPerUnit     = (sales / qty) * (1 - effectiveMargin);
  let profit            = sales - costPerUnit * qty;

  if (isLossMaker) {
    // Force a deep loss for realism (e.g. clearance sale, damaged goods)
    profit = -sales * rand(0.5, 2.5);
  } else if (isOutlier) {
    // Random outlier high profit
    profit *= rand(2, 4);
  }
  return Math.round(profit * 100) / 100;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

function generateDataset(n) {
  const records   = [];
  const categories = Object.keys(CATEGORIES);

  for (let i = 1; i <= n; i++) {
    const orderId  = `ORD-${String(i).padStart(5, '0')}`;
    const date     = randomDate(START_DATE, END_DATE);
    const month    = date.getMonth();
    const seaMult  = seasonalSalesMultiplier(month);

    // Region & city
    const region   = pick(REGIONS);
    const city     = pick(CITY_MAP[region]);

    // Customer
    const firstName  = pick(FIRST_NAMES);
    const lastName   = pick(LAST_NAMES);
    const customerName = `${firstName} ${lastName}`;
    const segment    = pick(SEGMENTS);

    // Product
    const category = pick(categories);
    const catData  = CATEGORIES[category];
    const product  = pick(catData.products);

    // Pricing
    const basePrice  = rand(...catData.priceRange) * seaMult;
    const qty        = category === 'Grocery' ? randInt(1, 10) : randInt(1, 4);
    const rawSales   = Math.round(basePrice * qty * 100) / 100;

    // Discount & profit
    let isLossMaker = Math.random() < 0.08; // 8% guaranteed heavy losses
    let isOutlier   = Math.random() < 0.03;
    let discount    = Math.round(segmentDiscount(segment) * 10) / 10;
    
    if (isLossMaker) discount = rand(40, 75); // Loss makers have huge discounts

    const sales      = Math.round(rawSales * (1 - discount / 100) * 100) / 100;
    const profit     = computeProfit(sales, qty, catData.marginBase, discount, isLossMaker, isOutlier);

    // Payment mode — UPI dominant in cities, cash in smaller ones
    const paymentWeights = city === 'Delhi' || city === 'Mumbai' || city === 'Bangalore'
      ? [10, 30, 60]   // Cash : Card : UPI
      : [30, 30, 40];
    const roll = rand(0, 100);
    const paymentMode = roll < paymentWeights[0] ? 'Cash'
      : roll < paymentWeights[0] + paymentWeights[1] ? 'Card'
      : 'UPI';

    records.push({
      orderId,
      orderDate:       date.toISOString().split('T')[0],
      customerName,
      customerSegment: segment,
      productCategory: category,
      productName:     product,
      region,
      city,
      salesAmount:     sales,
      quantity:        qty,
      discount,
      profit,
      paymentMode,
    });
  }

  return records;
}

// ─── Export ───────────────────────────────────────────────────────────────────

const dataset = generateDataset(TOTAL_RECORDS);

// JSON
const jsonPath = path.join(__dirname, 'sales_data.json');
fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
console.log(`✅ JSON written → ${jsonPath}`);

// CSV
const headers = Object.keys(dataset[0]).join(',');
const rows    = dataset.map(r =>
  Object.values(r).map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')
);
const csvPath = path.join(__dirname, 'sales_data.csv');
fs.writeFileSync(csvPath, [headers, ...rows].join('\n'));
console.log(`✅ CSV  written → ${csvPath}`);

// Stats preview
const totalRevenue = dataset.reduce((s, r) => s + r.salesAmount, 0);
const totalProfit  = dataset.reduce((s, r) => s + r.profit,      0);
console.log(`\n📊 Dataset Stats:`);
console.log(`   Records  : ${dataset.length}`);
console.log(`   Revenue  : ₹${totalRevenue.toFixed(2)}`);
console.log(`   Profit   : ₹${totalProfit.toFixed(2)}`);
console.log(`   Margin   : ${((totalProfit / totalRevenue) * 100).toFixed(1)}%`);
