"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get previous month string in MM-YYYY format
 */
function getPreviousMonth(monthYear: string): string {
  const [month, year] = monthYear.split("-").map(Number);
  let prevMonth = month - 1;
  let prevYear = year;
  
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  
  return `${prevMonth.toString().padStart(2, '0')}-${prevYear}`;
}

export async function getDiningCalc(monthYear: string) {
  try {
    let calc = await prisma.diningCalc.findUnique({
      where: { monthYear },
    });

    if (!calc) {
      // Calculate previous remaining
      const prevMonthStr = getPreviousMonth(monthYear);
      const prevCalc = await prisma.diningCalc.findUnique({
        where: { monthYear: prevMonthStr },
      });

      const prevRemaining = prevCalc 
        ? (prevCalc.depositAmount + prevCalc.previousRemaining) - prevCalc.totalCost 
        : 0;

      calc = await prisma.diningCalc.create({
        data: {
          monthYear,
          previousRemaining: prevRemaining,
        },
      });
    } else {
      // Re-calculate previous remaining just to be safe if previous month was updated
      const prevMonthStr = getPreviousMonth(monthYear);
      const prevCalc = await prisma.diningCalc.findUnique({
        where: { monthYear: prevMonthStr },
      });

      const expectedPrevRemaining = prevCalc 
        ? (prevCalc.depositAmount + prevCalc.previousRemaining) - prevCalc.totalCost 
        : 0;

      if (calc.previousRemaining !== expectedPrevRemaining) {
        calc = await prisma.diningCalc.update({
          where: { id: calc.id },
          data: { previousRemaining: expectedPrevRemaining },
        });
      }
    }

    return calc;
  } catch (error) {
    console.error("Error fetching DiningCalc:", error);
    throw new Error("Failed to fetch dining calculation");
  }
}

export async function updateDiningCalc(monthYear: string, depositAmount: number, totalCost: number) {
  try {
    const calc = await prisma.diningCalc.update({
      where: { monthYear },
      data: {
        depositAmount,
        totalCost,
      },
    });
    
    revalidatePath('/admin');
    return calc;
  } catch (error) {
    console.error("Error updating DiningCalc:", error);
    throw new Error("Failed to update dining calculation");
  }
}
