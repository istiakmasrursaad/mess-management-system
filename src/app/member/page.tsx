"use client";

import { useState, useEffect } from "react";
import { getMessData, toggleDailyMeal } from "@/app/actions/mess";
import { logoutAction, getSession } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Utensils, AlertTriangle, Clock, DollarSign, ShieldAlert, LogOut, Leaf } from "lucide-react";
import { toast } from "react-toastify";

export default function MemberDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  
  // Tomorrow's meal selection inputs
  const [breakfast, setBreakfast] = useState<number | string>(0.5);
  const [lunch, setLunch] = useState<number | string>(1);
  const [dinner, setDinner] = useState<number | string>(1);

  const fetchData = async () => {
    setLoading(true);
    const [res, session] = await Promise.all([getMessData(), getSession()]);
    setData(res);
    if (session?.userId) setSessionUserId(session.userId);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitMeals = async () => {
    const numBreakfast = Number(breakfast) || 0;
    const numLunch = Number(lunch) || 0;
    const numDinner = Number(dinner) || 0;

    // Pick logged in member from session userId
    const memberObj = data?.members.find((m: any) => m.member.userId === sessionUserId) || data?.members[0];
    if (!memberObj) return;

    const formData = new FormData();
    formData.append("memberId", memberObj.member.id);
    formData.append("breakfast", numBreakfast.toString());
    formData.append("lunchDinner", (numLunch + numDinner).toString());

    const result = await toggleDailyMeal(formData);
    if (result.isPastCutoff) {
      toast.warning("Notice: It is past 10:00 PM cutoff time. Changes will apply for the following day.");
    } else {
      toast.success("Meal options submitted successfully!");
    }
    await fetchData();
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25 mb-4 animate-float">
          <RefreshCw className="h-8 w-8 animate-spin text-white" />
        </div>
        <p className="text-muted-foreground font-semibold text-lg">Loading Member Portal & Live Accounts...</p>
      </div>
    );
  }

  // Find logged-in member account from session
  const currentAccount = data.members.find((m: any) => m.member.userId === sessionUserId) || data.members[0];

  return (
    <div className="flex-1 min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      
        {/* Header with Violet Gradient */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-violet-700 via-indigo-600 to-teal-500 rounded-2xl p-5 md:p-6 shadow-xl shadow-violet-500/20">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm mr-1">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Member Portal</h1>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30">Active Member</Badge>
            </div>
            <p className="text-emerald-100 text-sm mt-1.5 font-medium">
              Welcome back, <span className="font-bold text-white">{currentAccount.member.user.name}</span> (Room {currentAccount.member.roomNo})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white hover:border-white/50 backdrop-blur-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await logoutAction();
                window.location.href = "/";
              }}
              className="bg-white/90 text-emerald-700 hover:bg-white hover:text-emerald-800 border-0"
            >
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Real-time Status Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          
          <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm card-hover border-l-4 border-l-emerald-500 rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">My Total Meals</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-extrabold text-emerald-700">{currentAccount.totalMeals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Extra Meals: <span className="font-semibold text-foreground">{currentAccount.totalExtraMeals}</span> (Threshold: {data.settings.defaultDailyMealThreshold})
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm card-hover border-l-4 border-l-amber-500 rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Extra Billing Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-extrabold">
                {currentAccount.isNeedX2 ? (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-6 h-6" /> YES
                  </span>
                ) : (
                  <span className="text-emerald-600">NO</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Limit: {data.settings.needX2MealLimit} Extra Meals
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-gradient-to-br from-emerald-50 to-green-50 card-hover border-l-4 border-l-emerald-500 rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-emerald-700 uppercase tracking-wider">My Financial Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold">
                {currentAccount.due > 0 ? (
                  <span className="text-red-500">Due: ৳ {currentAccount.due.toFixed(2)}</span>
                ) : (
                  <span className="text-emerald-600">Advance: ৳ {currentAccount.advance.toFixed(2)}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentAccount.previousDue > 0 && <span className="text-red-500 font-semibold">Prev Due: ৳ {currentAccount.previousDue.toFixed(2)} | </span>}
                {currentAccount.previousAdvance > 0 && <span className="text-emerald-600 font-semibold">Prev Advance: ৳ {currentAccount.previousAdvance.toFixed(2)} | </span>}
                Total Deposits: ৳ {currentAccount.totalDeposits} | Fine: ৳ {currentAccount.marketFine}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Meal Polling / Toggle Widget */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
                  Daily Meal Polling (Tomorrow)
                </CardTitle>
                <CardDescription className="mt-1">
                  Toggle your meal requirements for tomorrow before the cutoff deadline.
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs border-emerald-300 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> Cutoff: {data.settings.mealCutoffTime}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-5 md:p-6">
            <div className="flex flex-col gap-4">
              
              {/* Breakfast Input */}
              <div className="flex items-center justify-between p-4 border border-emerald-100 rounded-2xl bg-gradient-to-r from-white to-emerald-50/50 shadow-sm card-hover">
                <div>
                  <p className="font-bold text-base">Breakfast (The next day)</p>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Lunch Input */}
              <div className="flex items-center justify-between p-4 border border-emerald-100 rounded-2xl bg-gradient-to-r from-white to-emerald-50/50 shadow-sm card-hover">
                <div>
                  <p className="font-bold text-base">Lunch</p>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={lunch}
                    onChange={(e) => setLunch(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Dinner Input */}
              <div className="flex items-center justify-between p-4 border border-emerald-100 rounded-2xl bg-gradient-to-r from-white to-emerald-50/50 shadow-sm card-hover">
                <div>
                  <p className="font-bold text-base">Dinner</p>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={dinner}
                    onChange={(e) => setDinner(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <Button onClick={handleSubmitMeals} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                  Submit Options
                </Button>
              </div>

            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 text-xs text-muted-foreground flex items-start sm:items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Unchanged slots automatically retain the default daily meal threshold (<strong>{data.settings.defaultDailyMealThreshold} meals/day</strong>). Choices auto-lock past {data.settings.mealCutoffTime}.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Individual Cost Breakdown Card */}
        <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 rounded-t-2xl">
            <CardTitle className="text-lg font-bold">My Monthly Financial Statement</CardTitle>
            <CardDescription>Live cost calculations based on Current Mess Meal Rate (৳ {data.liveMealRate.toFixed(2)})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 text-sm p-5 md:p-6">
            <div className="flex justify-between py-3 border-b border-emerald-100/50">
              <span className="text-muted-foreground">Individual Meal Cost ({currentAccount.totalMeals} meals &times; ৳{data.liveMealRate.toFixed(2)})</span>
              <span className="font-semibold">৳ {currentAccount.individualMealCost.toFixed(2)}</span>
            </div>

            {/* Overheads Breakdown */}
            <div className="py-3 border-b border-emerald-100/50">
              <span className="text-muted-foreground block mb-2 font-medium">Overheads Breakdown:</span>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Khala Bill {currentAccount.M_X2 > 1 ? `(× ${currentAccount.M_X2})` : ""}</span>
                  <span className="font-medium text-sm">৳ {(currentAccount.baseKhala * currentAccount.M_X2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Manager Bill {currentAccount.M_X2 > 1 ? `(× ${currentAccount.M_X2})` : ""}</span>
                  <span className="font-medium text-sm">৳ {(currentAccount.baseManager * currentAccount.M_X2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Gas Bill {currentAccount.M_X2 > 1 ? `(× ${currentAccount.M_X2})` : ""}</span>
                  <span className="font-medium text-sm">৳ {(currentAccount.baseGas * currentAccount.M_X2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Paper Bill</span>
                  <span className="font-medium text-sm">৳ {currentAccount.paper.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Current Bill</span>
                  <span className="font-medium text-sm">৳ {currentAccount.current.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Festival Bill</span>
                  <span className="font-medium text-sm">৳ {currentAccount.festival.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-3 border-b border-emerald-100/50">
              <span className="text-muted-foreground">Market Fine (Markets Logged: {currentAccount.totalMarketsCount})</span>
              <span className="font-semibold text-red-500">৳ {currentAccount.marketFine}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-emerald-200 font-bold text-base bg-emerald-50/50 -mx-5 md:-mx-6 px-5 md:px-6">
              <span>Total Monthly Cost</span>
              <span>৳ {currentAccount.totalCost.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-emerald-100/50 text-emerald-600 font-semibold">
              <span>Total Cash Deposits Paid</span>
              <span>- ৳ {currentAccount.totalDeposits}</span>
            </div>

            <div className="flex justify-between py-4 text-lg font-extrabold bg-gradient-to-r from-emerald-50 to-green-50 -mx-5 md:-mx-6 px-5 md:px-6 rounded-b-2xl mt-1">
              <span>Net Financial Status</span>
              {currentAccount.due > 0 ? (
                <span className="text-red-500">DUE: ৳ {currentAccount.due.toFixed(2)}</span>
              ) : (
                <span className="text-emerald-600">ADVANCE: ৳ {currentAccount.advance.toFixed(2)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
