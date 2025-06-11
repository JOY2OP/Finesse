// Mock expense data
export const initialExpenses = [
  {
    id: '1',
    amount: 120.50,
    description: 'Grocery shopping',
    date: '2023-06-15',
    category: 'needs',
  },
  {
    id: '2',
    amount: 45.99,
    description: 'Streaming subscription',
    date: '2023-06-12',
    category: 'wants',
  },
  {
    id: '3',
    amount: 500.00,
    description: 'ETF Investment',
    date: '2023-06-10',
    category: 'investing',
  },
  {
    id: '4',
    amount: 85.20,
    description: 'Electricity bill',
    date: '2023-06-08',
    category: 'needs',
  },
  {
    id: '5',
    amount: 65.75,
    description: 'Dinner out',
    date: '2023-06-05',
    category: 'wants',
  },
  {
    id: '6',
    amount: 250.00,
    description: 'Stock purchase',
    date: '2023-06-03',
    category: 'investing',
  },
  {
    id: '7',
    amount: 42.99,
    description: 'Water bill',
    date: '2023-06-01',
    category: 'needs',
  },
  {
    id: '8',
    amount: 120.00,
    description: 'Concert tickets',
    date: '2023-05-28',
    category: 'wants',
  },
  {
    id: '9',
    amount: 1000.00,
    description: 'Retirement contribution',
    date: '2023-05-25',
    category: 'investing',
  },
  {
    id: '10',
    amount: 55.40,
    description: 'Gas station',
    date: '2023-05-22',
    category: null,
  },
  {
    id: '11',
    amount: 28.75,
    description: 'Coffee shop',
    date: '2023-05-20',
    category: null,
  },
  {
    id: '12',
    amount: 95.00,
    description: 'Online purchase',
    date: '2023-05-18',
    category: null,
  },
];

// Canned responses for chat
export const chatResponses = {
  "hello": "Hello! I'm your Finesse financial assistant. How can I help you today?",
  "hi": "Hi there! I'm your Finesse financial assistant. How can I help with your finances today?",
  "help": "I can help you with budgeting tips, investment advice, and expense categorization. Just ask me a specific question!",
  "budget": "Creating a budget is essential! Start by tracking your expenses in the Home tab, then use the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and investments.",
  "investing": "For beginners, I recommend starting with low-cost index funds. They provide diversification and typically have lower fees than actively managed funds.",
  "save money": "To save money, try the 24-hour rule for non-essential purchases, meal prep to reduce food costs, and review your subscriptions regularly to cut unused services.",
  "debt": "To tackle debt effectively, consider the avalanche method (paying highest interest first) or the snowball method (paying smallest balances first for psychological wins).",
  "credit score": "To improve your credit score: pay bills on time, keep credit utilization under 30%, don't close old accounts, limit new credit applications, and regularly check your credit report.",
  "retirement": "For retirement planning, take advantage of employer 401(k) matching, consider opening a Roth IRA, and aim to save at least 15% of your income for retirement.",
  "emergency fund": "An emergency fund should cover 3-6 months of essential expenses. Keep it in a high-yield savings account for easy access and some interest growth.",
  "stock market": "The stock market has historically returned about 10% annually before inflation. For most people, investing in broad market index funds is the smartest approach.",
  "crypto": "Cryptocurrency is highly volatile. Only invest money you can afford to lose, and keep it as a small percentage of your overall portfolio (5-10% maximum for most investors).",
  "housing": "When buying a home, the 28/36 rule is helpful: spend no more than 28% of gross income on housing costs and no more than 36% on total debt.",
  "insurance": "Everyone should have health insurance, auto insurance (if you drive), renters/homeowners insurance, and consider disability and life insurance if you have dependents.",
};

// Initial chat messages
export const initialMessages = [
  {
    id: '1',
    text: "Welcome to Finesse! I'm your AI financial assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date().getTime() - 1000 * 60 * 5, // 5 minutes ago
  },
];