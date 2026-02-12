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
 * @typedef {Object} ThisWeekData
 * @property {string} status
 * @property {Action[]} actions
 * @property {string} summary
 */

/**
 * @typedef {Object} CoachData
 * @property {LastMonthData} lastMonth
 * @property {ThisWeekData} thisWeek
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
  thisWeek: {
    status: 'Great',
    actions: [
      {
        id: 'food',
        emoji: '🍔',
        title: 'Cut Food Delivery',
        subtitle: 'Target: ₹2,500 this week',
        targetAmount: '2,500',
        currentSpent: '20',
        color: '#10B981',
      },
      {
        id: 'subscriptions',
        emoji: '📺',
        title: 'Cancel Subscriptions',
        subtitle: 'Unused: ₹799/month',
        targetAmount: '799',
        currentSpent: '20',
        color: '#3B82F6',
      },
      {
        id: 'cabs',
        emoji: '🚕',
        title: 'Cap Cabs',
        subtitle: 'Set weekly limit: ₹400',
        targetAmount: '400',
        currentSpent: '20',
        color: '#8B5CF6',
      },
    ],
    summary: "💪 Stick to these 3 goals and you'll save ₹3,200 this week.",
  },
};
