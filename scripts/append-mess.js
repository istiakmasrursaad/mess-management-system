const fs = require('fs');

// Add import to the top of mess.ts
let content = fs.readFileSync('src/app/actions/mess.ts', 'utf8');
content = content.replace(
  'import { revalidatePath } from "next/cache";',
  'import { revalidatePath } from "next/cache";\nimport { getSession, getManagersAction } from "./auth";'
);

// Append function to the bottom
content += `

export async function getAdminDashboardInitialData(monthStr?: string, mealDate?: string) {
  const [data, meals, availableMonths, snapshots, session, managers] = await Promise.all([
    getMessData(monthStr),
    mealDate ? getDailyMealsByDate(mealDate) : Promise.resolve([]),
    getAvailableMonths(),
    getFinalizedSnapshots(),
    getSession(),
    getManagersAction()
  ]);

  return {
    data,
    meals,
    availableMonths,
    snapshots,
    session,
    managers
  };
}
`;

fs.writeFileSync('src/app/actions/mess.ts', content);
