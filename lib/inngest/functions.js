import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { get } from "react-hook-form";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const checkBudgetAlert = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },
  async ({ event, step }) => {
    const budgets = await step.run("Get Budget", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                }
              }
            }
          }
        }
      });
    }
    )
    for(const budget of budgets){
      const defaultAccount = budget.user.accounts[0];
      if(!defaultAccount) continue; // Skip if no default account

      await step.run(`Check Budget ${budget.id}`, async () => {

        const currentdate = new Date();
        const startOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth(), 1);
        const endOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 0);

        //Calculate all of the expenses
        const expenses = await db.transaction.aggregate({
          where:{
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          }
        });
        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        if(percentageUsed >= 80 && (!budget.lastAlertSent ||
        isNewMonth(new Date(budget.lastAlertSent), new Date()))) {
          //Send Email
          await sendEmail({
            to:budget.user.email,
            subject: `Budget alert for ${defaultAccount.name}`,
            react:EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {percentageUsed,
                    budgetAmount: parseInt(budgetAmount).toFixed(1),
                    totalExpenses: parseInt(totalExpenses).toFixed(1),
                    accountName: defaultAccount.name
            }
            })
          })

          //Update last alert
          await db.budget.update({
            where: {
              id: budget.id,
            },
            data: {
              lastAlertSent: new Date(),
            }
          })
        }
      });
    }
  }
);

function isNewMonth(lastAlertSent, currentDate){
  return(
    lastAlertSent.getMonth() !== currentDate.getMonth() ||
    lastAlertSent.getFullYear() !== currentDate.getFullYear()
  );
}

export const triggerRecurringTransactions = inngest.createFunction({
  id: "trigger-recurring-transactions",
  name: "Trigger Recurring Transactions",
}, {cron: "0 0 * * *"},
async ({step}) => {
  //Fetch all due recurring transactions
  const recurringTransactions = await step.run(
    "fetch-recurring-transactions",
    async () => {
      return await db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          OR: [
            {lastProcessed: null}, // Never processed
            {nextRecurringDate: {lte: new Date()}}, // Due date passed
          ]
        }
      })
    }
  )
  //Create events for each transactions
  if(recurringTransactions.length > 0){
    const events = recurringTransactions.map((transaction) => ({
      name: "transaction.recurring.process",
      data: {transactionId: transaction.id, userId: transaction.userId},
    }))

    //Send events to be processed
    await inngest.send(events);
  }
return { triggered: recurringTransactions.length };
}  
);



export const processRecurringTransactions = inngest.createFunction({
  id: "process-recurring-transaction",
  throttle: {
    limit: 10, //Only process 10 transactions
    period: "1m", //Per minute
    key: "event.data.userId", // Per user
  },
},
{event: "transaction.recurring.process"},
async({event, step}) => {
  //Validate event data
  if(!event?.data?.transactionId || !event?.data?.userId){
    console.error("Invalid event data:", event);
    return { error: "Missing required event data" };
  }

  await step.run("process-transaction", async() => {
    const transaction = await db.transaction.findUnique({
      where: {
        id: event.data.transactionId,
        userId: event.data.userId
      },
      include: {
        account: true,
      }
    })

    if(!transaction || !isTransactionDue(transaction)) return;

    await db.$transaction(async (tx) => {
      //Create new transaction
      await tx.transaction.create({
        data: {
          userId: transaction.userId,
          accountId: transaction.accountId,
          type: transaction.type,
          amount: transaction.amount,
          description: `${transaction.description}.recurring`,
          date: new Date(),
          category: transaction.category,
          isRecurring: false,
          // lastProcessed: new Date(),
          // nextRecurringDate: new Date(transaction.nextRecurringDate.getTime() + transaction.recurringInterval * 24 * 60 * 60 * 1000), // Add interval in days
        }
      });
      //Update account balance
      const balanceChange = transaction.type === "EXPENSE" ? -transaction.amount.toNumber() : transaction.amount.toNumber();

      await tx.account.update({
        where: { id: transaction.accountId },
        data: {balance: { increment: balanceChange } },
      });

      //Update last processed date
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          lastProcessed: new Date(),
          nextRecurringDate: calculateNextRecurringDate(
            new Date(),
            transaction.recurringInterval
          )
        }
      });
    })
  })
}
)

function isTransactionDue(transaction){
  //If no lastProcessed date, transaction is due
  if(!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  //Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(startDate, interval) {
    const date = new Date(startDate);

    switch (interval) {
        case "DAILY":
            date.setDate(date.getDate() + 1);
            break;
        case "WEEKLY":
            date.setDate(date.getDate() + 7);
            break;
        case "MONTHLY":
            date.setMonth(date.getMonth() + 1);
            break;
        case "YEARLY":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }

    return date;
}


export const generateMonthlyReport = inngest.createFunction(
  {id: "generate-monthly-report",
  name: "Generate Monthly Report",},
  {cron: "0 0 1 * *" }, // Run on the first day of every month at midnight
  async ({step}) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: {
          accounts: true,
        }
      });
    });

    //Generate report for users
    for(const user of users){
      await step.run(`generate-reort-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", { month: "long" });

        const insights = await generateFinancialInsights(stats, monthName);

        //Send email with report
        await sendEmail({
            to: user.email,
            subject: `Your monthly financial report - ${monthName}`,
            react: EmailTemplate({
              userName: user.name,
              type: "monthly-report",
              data: {
                stats,
                insights,
                month: monthName,
            }
            })
          })
      })
    }
    return { processed: users.length };
  }
)

async function generateFinancialInsights(stats, month){
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  }
  catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

const getMonthlyStats = async (userId, month) => {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if( t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.expensesByCategory[t.category] = (stats.expensesByCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
      expensesByCategory: {},
      transactionsCount: transactions.length,
    }
  )
}