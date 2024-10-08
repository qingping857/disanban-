(function() {
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const year = lastMonthDate.getFullYear();
    const month = lastMonthDate.getMonth() + 1;

    const mockEntries = [
        { item: '食品', amount: 500, note: '超市购物' },
        { item: '交通', amount: 200, note: '公交卡充值' },
        { item: '娱乐', amount: 300, note: '电影票' },
        { item: '购物', amount: 400, note: '衣服' }
    ];

    const mockBudgets = {
        '食品': 600,
        '交通': 250,
        '娱乐': 350,
        '购物': 450
    };

    const mockRedundancy = 50;

    const monthlyData = {
        entries: mockEntries,
        budgets: mockBudgets,
        redundancy: mockRedundancy
    };

    localStorage.setItem(`monthlyData-${year}-${month}`, JSON.stringify(monthlyData));

    console.log(`Mock data for ${year}-${month} has been added to localStorage.`);
})();

const mockData = {
    1: [
        { date: '2023-01-01', amount: 100, description: '新年礼物' },
        { date: '2023-01-15', amount: 200, description: '购物' }
    ],
    2: [
        { date: '2023-02-10', amount: 150, description: '情人节礼物' }
    ],
    // 其他月份的数据...
};