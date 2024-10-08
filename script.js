let entries = JSON.parse(localStorage.getItem('entries')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let redundancy = parseFloat(localStorage.getItem('redundancy')) || 0;
let redundancyLimit = parseFloat(localStorage.getItem('redundancyLimit')) || 300;
let savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
let savedBudgetItems = JSON.parse(localStorage.getItem('savedBudgetItems')) || [];

// 页面加载时更新所有显示信息
document.addEventListener("DOMContentLoaded", () => {
    updateEntryList();
    updateBudgetList();
    updateRedundancyAmount();
    updateItemTags();
    updateBudgetTags();
    updateTotalSpent(); // 更新累计支出
    document.getElementById("redundancy-limit-display").textContent = redundancyLimit;
    populateMonthSelect();
    renderSpendingChart();
});

function addEntry() {
    let item = document.getElementById("item").value;
    let amount = parseFloat(document.getElementById("amount").value);
    let note = document.getElementById("note").value;

    if (item && !isNaN(amount)) {
        // 保存账目项目为标签
        if (!savedItems.includes(item)) {
            savedItems.push(item);
            saveData('savedItems', savedItems);
        }
        updateItemTags();

        // 添加每笔账目信息
        entries.push({ item: item, amount: amount, note: note });
        saveData('entries', entries);

        // 更新冗余库状态
        checkBudgetAndUpdateRedundancy(item);

        // 更新账目信息列表
        updateEntryList();

        // 更新冗余库显示
        updateRedundancyAmount();

        // 更新小金库金额
        treasuryAmount = totalIncome - entries.reduce((sum, entry) => sum + entry.amount, 0);
        treasuryAmountDisplay.textContent = treasuryAmount;

        // 清空输入框
        document.getElementById("item").value = '';
        document.getElementById("amount").value = '';
        document.getElementById("note").value = '';

        updateTotalSpent(); // 更新累计支出
    } else {
        alert("请输入有效的账目和金额");
    }
}

function setBudget() {
    let budgetItem = document.getElementById("budget-item").value;
    let budgetLimit = parseFloat(document.getElementById("budget-limit").value);

    if (budgetItem && !isNaN(budgetLimit)) {
        if (budgets[budgetItem] === undefined) {
            budgets[budgetItem] = budgetLimit;
            saveData('budgets', budgets);

            // 保存预算项目为标签
            if (!savedBudgetItems.includes(budgetItem)) {
                savedBudgetItems.push(budgetItem);
                saveData('savedBudgetItems', savedBudgetItems);
            }
            updateBudgetTags();

            // 更新预算列表
            updateBudgetList();
            alert(`已为 ${budgetItem} 设定预算 ¥${budgetLimit}`);
        } else {
            alert("本月预算已设定，无法修改！");
        }

        // 清空输入框
        document.getElementById("budget-item").value = '';
        document.getElementById("budget-limit").value = '';
    } else {
        alert("请输入有效的预算项目和额度");
    }
}

function setRedundancyLimit() {
    let newLimit = parseFloat(document.getElementById("redundancy-limit").value);
    if (!isNaN(newLimit) && newLimit > 0) {
        redundancyLimit = newLimit;
        document.getElementById("redundancy-limit-display").textContent = redundancyLimit;
        saveData('redundancyLimit', redundancyLimit);
        alert(`冗余库额度已设置为 ¥${redundancyLimit}`);
    } else {
        alert("请输入有效的冗余库额度");
    }
}

function setUserName() {
    let userName = document.getElementById("user-name").value;
    if (userName.trim() !== "") {
        document.getElementById("header-title").textContent = `${userName}的记账系统`;
        saveData('userName', userName);
    } else {
        alert("请输入有效的名字");
    }
}

function setBackgroundImage() {
    let backgroundInput = document.getElementById("background-upload");
    let file = backgroundInput.files[0];

    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.body.style.background = `url('${e.target.result}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
            saveData('backgroundImage', e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        alert("请上传有效的图片文件");
    }
}

function checkBudgetAndUpdateRedundancy(item) {
    // 计算项目的累计金额
    let totalSpent = entries.filter(entry => entry.item === item)
                            .reduce((sum, entry) => sum + entry.amount, 0);

    if (budgets[item] !== undefined) {
        let budgetLimit = budgets[item];
        if (totalSpent > budgetLimit) {
            let excess = totalSpent - budgetLimit;
            if (redundancy + excess <= redundancyLimit) {
                redundancy += excess;
                saveData('redundancy', redundancy);
                alert(`项目 "${item}" 超出预算，超出部分 ¥${excess} 已记录到冗余库`);
            } else {
                alert("冗余库额度不足，无法记录所有超出部分！");
            }
        }
    }
}

function updateEntryList() {
    let entryList = document.getElementById("entry-list");
    entryList.innerHTML = '';

    entries.forEach((entry) => {
        let listItem = document.createElement('li');
        listItem.textContent = `${entry.item}: ¥${entry.amount} （备注: ${entry.note}）`;
        entryList.appendChild(listItem);
    });
}

function updateBudgetList() {
    let budgetList = document.getElementById("budget-list");
    budgetList.innerHTML = '';

    for (let item in budgets) {
        let totalSpent = entries.filter(entry => entry.item === item)
                                .reduce((sum, entry) => sum + entry.amount, 0);
        let budgetLimit = budgets[item];
        let displaySpent = totalSpent > budgetLimit ? budgetLimit : totalSpent;
        let excess = totalSpent > budgetLimit ? totalSpent - budgetLimit : 0;

        let listItem = document.createElement('li');
        listItem.innerHTML = `
            ${item}: ¥${displaySpent} / ¥${budgetLimit}
        `;

        // 如果有超出部分，计入冗余库
        if (excess > 0) {
            if (redundancy + excess <= redundancyLimit) {
                redundancy += excess;
                saveData('redundancy', redundancy);
                alert(`项目 "${item}" 超出预算，超出部分 ¥${excess} 已记录到冗余库`);
            } else {
                alert("冗余库额度不足，无法记录所有超出部分！");
            }
        }

        // 添加删除按钮
        let deleteButton = document.createElement('span');
        deleteButton.textContent = ' ×';
        deleteButton.className = 'delete-tag';
        deleteButton.onclick = () => {
            delete budgets[item];
            saveData('budgets', budgets);

            let index = savedBudgetItems.indexOf(item);
            if (index > -1) {
                savedBudgetItems.splice(index, 1);
                saveData('savedBudgetItems', savedBudgetItems);
            }
            updateBudgetList();
            updateBudgetTags();
        };

        listItem.appendChild(deleteButton);
        budgetList.appendChild(listItem);
    }
}

function updateRedundancyAmount() {
    let redundancyAmount = document.getElementById("redundancy-amount");
    redundancyAmount.textContent = redundancy;
}

function sortEntriesByTotal() {
    let totals = {};

    // 计算每个账目项目的总金额
    entries.forEach((entry) => {
        if (totals[entry.item]) {
            totals[entry.item] += entry.amount;
        } else {
            totals[entry.item] = entry.amount;
        }
    });

    // 将账目项目按总金额排序
    let sortedEntries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    let sortedEntryList = document.getElementById("sorted-entry-list");
    sortedEntryList.innerHTML = '';

    sortedEntries.forEach(([item, total]) => {
        let listItem = document.createElement('li');
        listItem.textContent = `${item}: 总金额 ¥${total}`;
        sortedEntryList.appendChild(listItem);
    });
}

function updateItemTags() {
    let itemTags = document.getElementById("item-tags");
    itemTags.innerHTML = '';

    savedItems.forEach((item, index) => {
        let tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = item;

        let deleteButton = document.createElement('span');
        deleteButton.textContent = ' ×';
        deleteButton.className = 'delete-tag';
        deleteButton.onclick = (event) => {
            event.stopPropagation(); // 防止点击删除按钮时触发标签点击事件
            savedItems.splice(index, 1);
            saveData('savedItems', savedItems);
            updateItemTags();
        };

        tagItem.appendChild(deleteButton);
        tagItem.onclick = () => {
            document.getElementById("item").value = item;
        };

        itemTags.appendChild(tagItem);
    });
}

function updateBudgetTags() {
    let budgetTags = document.getElementById("budget-tags");
    budgetTags.innerHTML = '';

    savedBudgetItems.forEach((item, index) => {
        let tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.textContent = item;

        let deleteButton = document.createElement('span');
        deleteButton.textContent = ' ×';
        deleteButton.className = 'delete-tag';
        deleteButton.onclick = (event) => {
            event.stopPropagation(); // 防止点击删除按钮时触发标签点击事件
            savedBudgetItems.splice(index, 1);
            saveData('savedBudgetItems', savedBudgetItems);
            updateBudgetTags();
        };

        tagItem.appendChild(deleteButton);
        tagItem.onclick = () => {
            document.getElementById("budget-item").value = item;
        };

        budgetTags.appendChild(tagItem);
    });
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showItemTags() {
    document.getElementById("item-tags").style.display = 'block';
}

function hideItemTags() {
    setTimeout(() => {
        document.getElementById("item-tags").style.display = 'none';
    }, 200);
}

function showBudgetTags() {
    document.getElementById("budget-tags").style.display = 'block';
}

function hideBudgetTags() {
    setTimeout(() => {
        document.getElementById("budget-tags").style.display = 'none';
    }, 200);
}

// 页面加载时恢复用户名和背景
document.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById("header-title").textContent = `${JSON.parse(userName)}的记账系统`;
    }

    const backgroundImage = localStorage.getItem('backgroundImage');
    if (backgroundImage) {
        document.body.style.background = `url('${JSON.parse(backgroundImage)}') no-repeat center center fixed`;
        document.body.style.backgroundSize = 'cover';
    }
});

let treasuryAmount = 0; // 小金库金额
const treasuryAmountDisplay = document.getElementById('treasury-amount');
const treasuryList = document.getElementById('treasury-list');

let totalIncome = 0; // 累计入账金额

function addIncome() {
    const description = document.getElementById('income-description').value;
    const amount = parseFloat(document.getElementById('income-amount').value);
    if (!description || isNaN(amount)) return;

    const listItem = document.createElement('li');
    listItem.textContent = `${description}: ¥${amount}`;
    treasuryList.appendChild(listItem);

    let currentAmount = parseFloat(localStorage.getItem('treasuryAmount')) || 0;
    currentAmount += amount;
    localStorage.setItem('treasuryAmount', currentAmount);
    document.getElementById('treasury-amount').textContent = currentAmount;

    // 保存收入记录
    let incomeRecords = JSON.parse(localStorage.getItem('incomeRecords')) || [];
    incomeRecords.push({ description, amount });
    localStorage.setItem('incomeRecords', JSON.stringify(incomeRecords));
}

function loadTreasuryAmount() {
    const currentAmount = parseFloat(localStorage.getItem('treasuryAmount')) || 0;
    document.getElementById('treasury-amount').textContent = currentAmount;

    // 加载收入记录
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords')) || [];
    incomeRecords.forEach(record => {
        const listItem = document.createElement('li');
        listItem.textContent = `${record.description}: ¥${record.amount}`;
        treasuryList.appendChild(listItem);
    });
}

document.addEventListener('DOMContentLoaded', loadTreasuryAmount);

function updateProgressBars() {
    const budgetItems = document.querySelectorAll('.budget-item');
    budgetItems.forEach((item, index) => {
        const progressBar = item.querySelector('.progress');
        const budget = budgets[index];
        const spentPercentage = (budget.spent / budget.total) * 100;
        progressBar.style.width = spentPercentage + '%';
    });
}

document.addEventListener('DOMContentLoaded', updateProgressBars);

function updateTotalSpent() {
    let totalSpent = entries.reduce((sum, entry) => sum + entry.amount, 0);
    document.getElementById("total-spent").textContent = totalSpent;
}

function saveMonthlyData() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // 检查是否是每月的第一天
    if (currentDate.getDate() === 1) {
        const monthlyData = {
            entries: entries,
            budgets: budgets,
            redundancy: redundancy
        };

        // 保存数据到 localStorage
        localStorage.setItem(`monthlyData-${year}-${month}`, JSON.stringify(monthlyData));

        // 清空当前数据
        entries = [];
        budgets = {};
        redundancy = 0;
        saveData('entries', entries);
        saveData('budgets', budgets);
        saveData('redundancy', redundancy);

        // 更新页面显示
        updateEntryList();
        updateBudgetList();
        updateRedundancyAmount();
        updateTotalSpent();
    }
}

// 页面加载时检查是否需要保存月数据
document.addEventListener("DOMContentLoaded", () => {
    saveMonthlyData();
    // ... existing code ...
});

document.addEventListener('DOMContentLoaded', function() {
    populateMonthSelect();
});

function populateMonthSelect() {
    const monthSelect = document.getElementById('month-select');
    const months = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // 假设月份从1开始
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

function loadMonthData() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const selectedYear = yearSelect.value;
    const selectedMonth = monthSelect.value;
    if (!selectedYear || !selectedMonth) {
        alert('请选择一个年份和月份');
        return;
    }

    // 假设有一个函数 fetchMonthData 用于获取数据
    fetchMonthData(selectedYear, selectedMonth).then(data => {
        displayMonthData(data);
    }).catch(error => {
        console.error('加载数据时出错:', error);
    });
}

function fetchMonthData(month) {
    // 模拟异步数据获取
    return new Promise((resolve, reject) => {
        // 使用 mock-data.js 中的数据
        const data = mockData[month];
        if (data) {
            resolve(data);
        } else {
            reject('没有找到数据');
        }
    });
}

function displayMonthData(data) {
    const monthDataList = document.getElementById('month-data-list');
    monthDataList.innerHTML = ''; // 清空现有数据

    data.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.date}: ${entry.amount} 元 - ${entry.description}`;
        monthDataList.appendChild(li);
    });
}

function renderSpendingChart() {
    const ctx = document.getElementById('spendingChart').getContext('2d');

    // 获取用户记录的数据
    const monthlySpending = Array(12).fill(0); // 初始化每月支出为0
    entries.forEach(entry => {
        // 假设每个entry有一个date属性
        const entryDate = new Date(entry.date);
        const month = entryDate.getMonth(); // 获取月份（0-11）
        monthlySpending[month] += entry.amount; // 累加每月支出
    });

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
            datasets: [{
                label: '当月支出 (元)',
                data: monthlySpending,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    ticks: {
                        autoSkip: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '支出 (元)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', renderSpendingChart);