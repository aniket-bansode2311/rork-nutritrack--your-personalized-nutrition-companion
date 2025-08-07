import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import profileGetRoute from "./routes/profile/get/route";
import profileCreateRoute from "./routes/profile/create/route";
import profileUpdateRoute from "./routes/profile/update/route";
import foodLogRoute from "./routes/food/log/route";
import foodEntriesRoute from "./routes/food/entries/route";
import foodDeleteRoute from "./routes/food/delete/route";
import recipesCreateRoute from "./routes/recipes/create/route";
import recipesListRoute from "./routes/recipes/list/route";
import customFoodsCreateRoute from "./routes/custom-foods/create/route";
import customFoodsListRoute from "./routes/custom-foods/list/route";
import weightLogRoute from "./routes/progress/weight/log/route";
import weightHistoryRoute from "./routes/progress/weight/history/route";
import waterLogRoute from "./routes/progress/water/log/route";
import waterHistoryRoute from "./routes/progress/water/history/route";
import activityLogRoute from "./routes/progress/activity/log/route";
import activityHistoryRoute from "./routes/progress/activity/history/route";
import nutritionTrendsRoute from "./routes/progress/nutrition/trends/route";
import measurementLogRoute from "./routes/progress/measurements/log/route";
import measurementHistoryRoute from "./routes/progress/measurements/history/route";
import progressStatsRoute from "./routes/progress/stats/route";
import generateInsightsRoute from "./routes/insights/generate/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  profile: createTRPCRouter({
    get: profileGetRoute,
    create: profileCreateRoute,
    update: profileUpdateRoute,
  }),
  food: createTRPCRouter({
    log: foodLogRoute,
    entries: foodEntriesRoute,
    delete: foodDeleteRoute,
  }),
  recipes: createTRPCRouter({
    create: recipesCreateRoute,
    list: recipesListRoute,
  }),
  customFoods: createTRPCRouter({
    create: customFoodsCreateRoute,
    list: customFoodsListRoute,
  }),
  progress: createTRPCRouter({
    weight: createTRPCRouter({
      log: weightLogRoute,
      history: weightHistoryRoute,
    }),
    water: createTRPCRouter({
      log: waterLogRoute,
      history: waterHistoryRoute,
    }),
    activity: createTRPCRouter({
      log: activityLogRoute,
      history: activityHistoryRoute,
    }),
    nutrition: createTRPCRouter({
      trends: nutritionTrendsRoute,
    }),
    measurements: createTRPCRouter({
      log: measurementLogRoute,
      history: measurementHistoryRoute,
    }),
    stats: progressStatsRoute,
  }),
  insights: createTRPCRouter({
    generate: generateInsightsRoute,
  }),
});

export type AppRouter = typeof appRouter;