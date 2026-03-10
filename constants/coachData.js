// @ts-check

/**
 * @typedef {Object} RankedCategory
 * @property {number} rank
 * @property {string} category
 * @property {string} amount
 * @property {string} label
 */

/**
 * @typedef {Object} SpendingSplit
 * @property {string} category
 * @property {string} expected
 * @property {string} actual
 */

/**
 * @typedef {Object} Challenge
 * @property {string} id
 * @property {string} emoji
 * @property {string} missionType
 * @property {string} title
 * @property {string} amount
 * @property {number} progress
 * @property {'completed' | 'warning' | 'regular'} status
 * @property {string} [statusText]
 * @property {string} color
 */

/**
 * @typedef {Object} Action
 * @property {string} id
 * @property {string} emoji
 * @property {string} title
 * @property {string} subtitle
 * @property {string} targetAmount
 * @property {string} currentSpent
 * @property {string} color
 */

/**
 * @typedef {Object} LastMonthData
 * @property {string} status
 * @property {RankedCategory[]} rankedCategories
 * @property {string[]} insights
 * @property {SpendingSplit[]} spendingSplit
 * @property {string} summary
 */

/**
 * @typedef {Object} ThisMonthData
 * @property {string} status
 * @property {number} [streak]
 * @property {Challenge[]} [challenges]
 * @property {Action[]} [actions]
 * @property {SpendingSplit[]} [spendingSplit]
 * @property {string[]} [insights]
 * @property {string} summary
 */

/**
 * @typedef {Object} CoachData
 * @property {LastMonthData} lastMonth
 * @property {ThisMonthData} thisMonth
 */

/** @type {CoachData} */
export const coachData = {
  lastMonth: {
    status: 'OK',
    rankedCategories: [
      {
        rank: 1,
        category: 'Food',
        amount: '₹4,200',
        label: 'Highest spend category',
      },
      {
        rank: 2,
        category: 'Subscriptions',
        amount: '₹1,998',
        label: 'Second biggest drain',
      },
      {
        rank: 3,
        category: 'Cabs',
        amount: '₹400',
        label: 'Smaller, but frequent',
      },
    ],
    insights: [
      'Your top 2 categories made up most of your extra spending.',
      'Food delivery alone cost you ₹4,200 this month.',
      'Subscriptions took nearly ₹2,000 without daily use.',
      'Your wants spending was higher than your savings.',
    ],
    spendingSplit: [
      { category: 'Needs', expected: '50%', actual: '50%' },
      { category: 'Wants', expected: '30%', actual: '40%' },
      { category: 'Savings', expected: '20%', actual: '10%' },
    ],
    summary: '💡 Overall, last month was spend-heavy and savings-light.',
  },
  thisMonth: {
    status: 'Great',
    streak: 3,
    challenges: [
      {
        id: 'invest',
        emoji: '💰',
        missionType: 'MISSION: INVEST',
        title: 'Fixed Deposit',
        amount: '₹250',
        progress: 100,
        status: 'completed',
        color: '#0052FF',
      },
      {
        id: 'groceries',
        emoji: '🛒',
        missionType: 'MISSION: CURB SPEND',
        title: 'Groceries',
        amount: '₹135',
        progress: 85,
        status: 'warning',
        statusText: '+12% vs avg',
        color: '#F97316',
      },
      {
        id: 'realestate',
        emoji: '🏢',
        missionType: 'MISSION: MAINTAIN',
        title: 'Real Estate',
        amount: '₹120',
        progress: 40,
        status: 'regular',
        color: '#64748B',
      },
    ],
    spendingSplit: [
      { category: 'Needs', expected: '50%', actual: '19%' },
      { category: 'Wants', expected: '30%', actual: '56%' },
      { category: 'Savings', expected: '20%', actual: '25%' },
    ],
    insights: [
      'Savings are at 25% of spending. Great start, but let\'s aim for 30% by optimizing discretionary spend.',
      'Review Groceries. Frequent small transactions are adding up to ₹135 weekly.',
    ],
    summary: 'Your wants spending ate into your potential savings last month.',
  },
};
